import LogoPlaceholder from "./LogoPlaceholder";

const Footer = () => (
  <footer className="bg-foreground text-background">
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h4 className="font-display font-semibold text-sm mb-4 text-primary">Platform</h4>
          <ul className="space-y-2 font-body text-sm text-background/60">
            <li><a href="/how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
            <li><a href="#ecosystem" className="hover:text-primary transition-colors">Ecosystem</a></li>
            <li><a href="#group-buy" className="hover:text-primary transition-colors">Group Buy</a></li>
            <li><a href="#health-tips" className="hover:text-primary transition-colors">Health Tips</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-4 text-primary">For Users</h4>
          <ul className="space-y-2 font-body text-sm text-background/60">
            <li><a href="/signup/student" className="hover:text-primary transition-colors">Order Food</a></li>
            <li><a href="/signup/vendor" className="hover:text-primary transition-colors">Sell Food</a></li>
            <li><a href="/signup/farmer" className="hover:text-primary transition-colors">Supply Produce</a></li>
            <li><a href="/signup/rider" className="hover:text-primary transition-colors">Deliver Orders</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-4 text-primary">Support</h4>
          <ul className="space-y-2 font-body text-sm text-background/60">
            <li><a href="/support" className="hover:text-primary transition-colors">Help Center</a></li>
            <li><a href="/support" className="hover:text-primary transition-colors">Submit a Ticket</a></li>
            <li><a href="/support" className="hover:text-primary transition-colors">FAQs</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm mb-4 text-primary">Technology</h4>
          <ul className="space-y-2 font-body text-sm text-background/60">
            <li><span>React + Vite</span></li>
            <li><span>Supabase</span></li>
            <li><span>Paystack</span></li>
            <li><span>Vercel</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <LogoPlaceholder size="sm" />
        <p className="font-body text-xs text-background/40 text-center">
          © 2026 Bukks Platform · Built by{" "}
          <a
            href="https://emmtecsecurities.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            EMMTEC Securities
          </a>{" "}
          — Providing solutions through tech
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
