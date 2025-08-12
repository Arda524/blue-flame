import { useEffect } from "react";
import FireballCanvas from "@/components/FireballCanvas";

const Index = () => {
  useEffect(() => {
    // Basic SEO for the home page
    document.title = "Mystical Blue Fireball Cursor Trail";

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta(
      "description",
      "A soft, glowing blue fireball follows your cursor with an ethereal trail and calm upward burn when idle."
    );

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      <header className="container py-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Mystical Blue Fireball Cursor Trail
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Move your mouse to gently attract a glowing fireball. Pause to see the
          flame rise upward in a calm, steady burn.
        </p>
      </header>
      <main className="container pb-24">
        <section className="rounded-lg border bg-card/50 backdrop-blur-sm p-8">
          <article className="prose prose-invert max-w-none">
            <p className="text-foreground/80">
              Enjoy the subtle flicker and ethereal trail as it follows you
              around. This effect respects reduced motion preferences.
            </p>
          </article>
        </section>
      </main>
      <FireballCanvas />
    </div>
  );
};

export default Index;
