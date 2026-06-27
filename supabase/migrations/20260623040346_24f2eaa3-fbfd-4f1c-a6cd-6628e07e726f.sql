
CREATE TYPE public.proof_status AS ENUM ('submitted', 'approved', 'rejected');

CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  label_ar TEXT,
  bank_name TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  account_number TEXT,
  iban TEXT,
  swift TEXT,
  currency public.currency_code NOT NULL,
  country TEXT,
  notes TEXT,
  notes_ar TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bank_accounts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active bank accounts" ON public.bank_accounts FOR SELECT TO anon, authenticated
  USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage bank accounts" ON public.bank_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_bank_accounts_updated BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.bank_accounts (label, label_ar, bank_name, account_holder, iban, swift, currency, country, sort_order) VALUES
  ('SAR account (Saudi Arabia)', 'حساب بالريال السعودي', 'Al Rajhi Bank', 'Advanced Koryo', 'SA00 0000 0000 0000 0000 0000', 'RJHISARI', 'SAR', 'SA', 1),
  ('USD account (Korea)', 'حساب بالدولار (كوريا)', 'KEB Hana Bank', 'Advanced Koryo Co., Ltd.', 'KR00 0000 0000 0000 000', 'KOEXKRSE', 'USD', 'KR', 2),
  ('KRW account (Korea)', 'حساب بالون الكوري', 'KEB Hana Bank', 'Advanced Koryo Co., Ltd.', 'KR00 0000 0000 0000 001', 'KOEXKRSE', 'KRW', 'KR', 3);

CREATE TABLE public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  receipt_url TEXT NOT NULL,
  sender_name TEXT,
  reference_note TEXT,
  amount_claimed NUMERIC(14,2),
  currency public.currency_code,
  status public.proof_status NOT NULL DEFAULT 'submitted',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payment_proofs TO authenticated;
GRANT ALL ON public.payment_proofs TO service_role;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own proofs" ON public.payment_proofs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own proofs" ON public.payment_proofs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage proofs" ON public.payment_proofs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_payment_proofs_updated BEFORE UPDATE ON public.payment_proofs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_payment_proofs_payment ON public.payment_proofs(payment_id);
