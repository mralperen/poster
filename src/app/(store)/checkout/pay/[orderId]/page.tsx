import { CheckoutPayView } from "@/components/CheckoutPayView";

export const dynamic = "force-dynamic";

type PayPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function CheckoutPayPage({ params }: PayPageProps) {
  const { orderId } = await params;
  return <CheckoutPayView orderId={orderId} />;
}
