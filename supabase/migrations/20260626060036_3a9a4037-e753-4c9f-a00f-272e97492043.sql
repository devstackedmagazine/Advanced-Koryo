
CREATE TABLE public.legal_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  content_ar jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  text_color text NOT NULL DEFAULT '#111111',
  heading_color text NOT NULL DEFAULT '#000000',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.legal_pages TO anon;
GRANT SELECT ON public.legal_pages TO authenticated;
GRANT ALL ON public.legal_pages TO service_role;

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal pages are publicly viewable"
  ON public.legal_pages FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert legal pages"
  ON public.legal_pages FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update legal pages"
  ON public.legal_pages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete legal pages"
  ON public.legal_pages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_legal_pages_updated_at
  BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.legal_pages (slug, title_ar, title_en, content_ar, content_en) VALUES
('terms',
 'شروط الاستخدام',
 'Terms of Use',
 '[{"heading":"مقدمة","body":"مرحباً بكم في موقعنا. باستخدامكم لخدماتنا فإنكم توافقون على هذه الشروط."},{"heading":"استخدام الخدمة","body":"يلتزم المستخدم باستخدام الموقع لأغراض مشروعة فقط."},{"heading":"التواصل","body":"لأي استفسار يرجى التواصل معنا عبر صفحة اتصل بنا."}]'::jsonb,
 '[{"heading":"Introduction","body":"Welcome to our website. By using our services you agree to these terms."},{"heading":"Use of Service","body":"The user agrees to use the website only for lawful purposes."},{"heading":"Contact","body":"For any inquiries please reach us via the Contact page."}]'::jsonb),
('privacy',
 'سياسة الخصوصية',
 'Privacy Policy',
 '[{"heading":"المعلومات التي نجمعها","body":"نقوم بجمع المعلومات التي تقدمها عند استخدام الموقع."},{"heading":"استخدام المعلومات","body":"تُستخدم بياناتك لتقديم الخدمة والتواصل معك."},{"heading":"حماية البيانات","body":"نتخذ الإجراءات اللازمة لحماية بياناتك."}]'::jsonb,
 '[{"heading":"Information We Collect","body":"We collect information you provide when using the site."},{"heading":"Use of Information","body":"Your data is used to provide the service and contact you."},{"heading":"Data Protection","body":"We take appropriate steps to safeguard your data."}]'::jsonb);
