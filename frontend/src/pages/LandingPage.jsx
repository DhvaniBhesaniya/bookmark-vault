import { motion } from 'framer-motion';
import { Bookmark, Search, Tag, Shield, Database, Layout, Github, ChevronRight } from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import { AnimatedGridPattern } from '../components/magicui/AnimatedGridPattern';
import { ShimmerButton } from '../components/magicui/ShimmerButton';
import { Button } from '../components/ui/button';

const features = [
  {
    icon: Bookmark,
    title: "Bookmark Everything",
    description: "Save links, articles, and resources effortlessly. Your digital brain organized in one place."
  },
  {
    icon: Tag,
    title: "AI Auto-Tagging",
    description: "Let Gemini AI automatically generate context-aware tags and summaries for your saved content."
  },
  {
    icon: Search,
    title: "Full Text Search",
    description: "Find exactly what you need with lightning-fast search across titles, descriptions, and URLs."
  },
  {
    icon: Layout,
    title: "Smart Collections",
    description: "Group related bookmarks into curated collections for easy access and project management."
  },
  {
    icon: Shield,
    title: "Self-Hostable",
    description: "Keep full control of your data. Deploy easily with Docker and manage your own instance."
  },
  {
    icon: Database,
    title: "Import & Export",
    description: "Never get locked in. Easily import from your browser and export your data anytime."
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col font-sans selection:bg-accent/20">
      <LandingNavbar />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-gutter">
          <AnimatedGridPattern className="opacity-[0.25] pointer-events-none" />
          <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/10 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-container mx-auto relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent-light text-sm font-medium mb-8 border border-accent/20 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              100% Free & Open Source
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-display-md md:text-display-xl font-display tracking-tight max-w-4xl mx-auto leading-[1.1]"
            >
              The AI-Powered Bookmark <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-light">
                Everything App
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-text-muted max-w-2xl mx-auto"
            >
              Quickly save links and resources. Let Bookmarkvault automatically tag and summarize them for you using AI. Built for the data hoarders.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a href="https://github.com/DhvaniBhesaniya/bookmark-vault" target="_blank" rel="noopener noreferrer">
                <ShimmerButton background="var(--accent)" className="h-12 px-8 text-base font-semibold text-white">
                  <span className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    Star on GitHub
                  </span>
                </ShimmerButton>
              </a>
              <a href="https://github.com/DhvaniBhesaniya/bookmark-vault" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="h-12 px-8 font-semibold bg-bg-elevated/50 backdrop-blur-md hover:bg-bg-secondary border-border/50 transition-all">
                  <span className="flex items-center gap-2">
                    Clone & Use
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        {/* SERVICES / FEATURES SECTION */}
        <section id="service" className="py-24 bg-bg-elevated/30 border-y border-border/50 px-gutter">
          <div className="max-w-container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-display-sm font-display tracking-tight mb-4">Everything you need</h2>
              <p className="text-text-muted max-w-2xl mx-auto">
                A complete toolkit for saving, organizing, and rediscovering your content, powered by modern technologies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-bg-secondary/50 backdrop-blur-sm border border-border/50 hover:border-accent/30 transition-all duration-300 group hover:-translate-y-1 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-accent-light" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT US / OPEN SOURCE SECTION */}
        <section id="about" className="py-24 px-gutter relative overflow-hidden">
          <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-accent-container/5 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center mx-auto mb-6 shadow-ambient">
              <Github className="w-8 h-8 text-text-primary" />
            </div>
            <h2 className="text-display-sm font-display tracking-tight mb-6">Free & Open Source</h2>
            <p className="text-lg text-text-muted mb-8 leading-relaxed">
              Bookmark Vault is a fully open-source project designed to give you complete control over your data. 
              We believe your digital knowledge base should belong to you. Run it on your own server, keep full control, and contribute to the community.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="https://github.com/DhvaniBhesaniya/bookmark-vault" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="border-accent/30 hover:border-accent/50 hover:bg-accent/5">
                  <Github className="w-5 h-5 mr-2" />
                  View Source Code
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-12 px-gutter bg-bg-secondary/30">
        <div className="max-w-container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <Bookmark className="w-5 h-5 text-accent" />
            <span className="font-display font-medium text-lg">Bookmarkvault</span>
          </div>
          
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Bookmark Vault Project. Open Source under MIT.
          </p>
          
          <div className="flex gap-4">
            <a href="https://github.com/DhvaniBhesaniya/bookmark-vault" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
