import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Sparkles, ArrowRight, Activity, Zap, Compass } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground dark overflow-x-hidden">
      {/* Navbar */}
      <nav className="border-b border-border/40 backdrop-blur-md bg-background/80 fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">KENKAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Đăng nhập</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Bắt đầu
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative">
        <div className="absolute inset-0 top-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
        
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8 border border-border/50">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Đối tác tư duy chiến lược AI của bạn</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Biến sự không chắc chắn <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">thành sự rõ ràng</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              A strategic AI thinking partner that helps you understand yourself, clarify your goals, and build action plans for life, career, and business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-full sm:w-auto">
                  Bắt đầu đánh giá của bạn
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full w-full sm:w-auto border-border hover:bg-secondary">
                  Xem báo cáo mẫu
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Domains Section */}
      <section className="py-24 px-6 bg-secondary/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Ba trụ cột phát triển</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Khám phá và xây dựng chiến lược cho mọi khía cạnh quan trọng của bạn.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border/50 rounded-2xl p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Phát triển cá nhân</h3>
              <p className="text-muted-foreground leading-relaxed">Hiểu rõ điểm mạnh, điểm yếu và xây dựng thói quen tốt để đạt được sự cân bằng trong cuộc sống.</p>
            </div>
            
            <div className="bg-card border border-border/50 rounded-2xl p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Compass className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Phát triển sự nghiệp</h3>
              <p className="text-muted-foreground leading-relaxed">Định hướng con đường sự nghiệp, phát triển kỹ năng và xây dựng lộ trình thăng tiến rõ ràng.</p>
            </div>
            
            <div className="bg-card border border-border/50 rounded-2xl p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-violet-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Kinh doanh & Khởi nghiệp</h3>
              <p className="text-muted-foreground leading-relaxed">Đánh giá sức khỏe doanh nghiệp, phân tích thị trường và xây dựng chiến lược tăng trưởng bền vững.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
