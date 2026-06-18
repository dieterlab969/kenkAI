# HƯỚNG DẪN TRIỂN KHAI NHANH — KENKAI
### 5-Minute Deployment Guide · Ubuntu Server · Node.js + PostgreSQL + Nginx

---

## 1. Yêu cầu tiên quyết (Prerequisites)

- **OS**: Ubuntu 22.04 / 24.04 LTS
- **Node.js**: 20.x LTS
- **pnpm**: 9.x
- **PostgreSQL**: 15+
- **Nginx**: latest stable
- **PM2**: latest (process manager)
- **Git**: pre-installed trên Ubuntu
- **Google Gemini API Key** (lấy tại [aistudio.google.com](https://aistudio.google.com))

---

## 2. Chuẩn bị môi trường & Cài đặt phụ thuộc (One-Click Setup)

Chạy một lần, copy toàn bộ block dưới đây:

```bash
sudo apt-get update && sudo apt-get upgrade -y

# Cài Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx postgresql postgresql-contrib

# Cài pnpm
npm install -g pnpm@latest

# Cài PM2 (process manager)
npm install -g pm2

# Kích hoạt và khởi động PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Kích hoạt Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

**Kiểm tra nhanh:**
```bash
node -v && pnpm -v && psql --version && nginx -v
```

---

## 3. Cấu hình Dự án (Project Configuration)

### 3.1 Tải source code

```bash
cd /var/www
sudo git clone https://github.com/your-org/kenkai.git
sudo chown -R $USER:$USER /var/www/kenkai
cd /var/www/kenkai
```

### 3.2 Cài đặt tất cả dependencies (toàn bộ monorepo)

```bash
pnpm install
```

### 3.3 Cấu hình biến môi trường

```bash
cp .env.example .env
nano .env
```

Chỉ cần sửa các biến sau:

```env
# ─── DATABASE ───────────────────────────────────────
DATABASE_URL=postgresql://kenkai_user:YOUR_PASSWORD@localhost:5432/kenkai_db

# ─── GOOGLE GEMINI ──────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key_here

# ─── SERVER ─────────────────────────────────────────
PORT=3001
NODE_ENV=production
```

### 3.4 Build toàn bộ dự án

```bash
# Build API Server
pnpm --filter @workspace/api-server run build

# Build Frontend (React + Vite)
pnpm --filter @workspace/kenkai run build
```

---

## 4. Cấu hình Database & Web Server

### 4.1 Tạo Database & User PostgreSQL

```bash
sudo -u postgres psql <<EOF
CREATE USER kenkai_user WITH PASSWORD 'YOUR_PASSWORD';
CREATE DATABASE kenkai_db OWNER kenkai_user;
GRANT ALL PRIVILEGES ON DATABASE kenkai_db TO kenkai_user;
EOF
```

### 4.2 Chạy Database Migration (Drizzle ORM)

```bash
pnpm --filter @workspace/db run db:push
```

### 4.3 Cấu hình Nginx

Tạo file cấu hình tại `/etc/nginx/sites-available/kenkai`:

```bash
sudo nano /etc/nginx/sites-available/kenkai
```

Dán nội dung sau (thay `your-domain.com` bằng domain hoặc IP thật):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # ── Frontend (React build) ──────────────────────
    root /var/www/kenkai/artifacts/kenkai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # ── API Server (proxy đến Express.js) ──────────
    location /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # ── SSE Streaming (Gemini AI Chat) ─────────
        proxy_buffering    off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # ── Gzip Compression ────────────────────────────
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

Kích hoạt và reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/kenkai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Khởi chạy & Kiểm tra (Launch & Verification)

### 5.1 Cấp quyền thư mục

```bash
sudo chown -R www-data:www-data /var/www/kenkai/artifacts/kenkai/dist
sudo chmod -R 755 /var/www/kenkai/artifacts/kenkai/dist
```

### 5.2 Khởi chạy API Server bằng PM2

```bash
cd /var/www/kenkai

pm2 start artifacts/api-server/dist/index.mjs \
  --name "kenkai-api" \
  --interpreter node \
  -- --enable-source-maps

# Tự động start lại khi server reboot
pm2 save
pm2 startup
```

### 5.3 Kiểm tra trạng thái

```bash
# Xem PM2 process
pm2 status

# Xem log API server
pm2 logs kenkai-api --lines 20

# Kiểm tra health endpoint
curl -s http://localhost:3001/api/healthz
# Kết quả mong đợi: {"status":"ok"} hoặc tương tự

# Kiểm tra qua Nginx
curl -s http://your-domain.com/api/healthz

# Kiểm tra frontend được serve
curl -I http://your-domain.com
# Kết quả mong đợi: HTTP/1.1 200 OK
```

### 5.4 (Tuỳ chọn) Bật HTTPS với Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## Tóm tắt lệnh (Quick Reference)

| Tác vụ | Lệnh |
|---|---|
| Restart API | `pm2 restart kenkai-api` |
| Xem log | `pm2 logs kenkai-api` |
| Stop API | `pm2 stop kenkai-api` |
| Rebuild sau khi update code | `pnpm --filter @workspace/api-server run build` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Chạy lại migration | `pnpm --filter @workspace/db run db:push` |

---

## Troubleshooting

**API không khởi động được**
```bash
pm2 logs kenkai-api --err --lines 50
```
→ Kiểm tra `DATABASE_URL` và `GEMINI_API_KEY` trong `.env`

**Nginx trả về 502 Bad Gateway**
```bash
pm2 status          # Kiểm tra API có đang chạy không
sudo nginx -t       # Kiểm tra cú pháp config
```

**Lỗi kết nối database**
```bash
psql -U kenkai_user -d kenkai_db -h localhost
```
→ Xác nhận `DATABASE_URL` khớp với thông tin đã tạo ở bước 4.1

---

*Tài liệu này được viết cho KENKAI · Cập nhật lần cuối: 2026*
