import { readTextFile, writeTextFile } from "@/lib/db/storage";
import type { PricingConfig } from "@/lib/pricing";
import { brand } from "@/lib/brand";

export type InfoItem = {
  title: string;
  text: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type ContactCard = {
  title: string;
  value: string;
  href: string;
};

export type ReviewItem = {
  name: string;
  meta: string;
  text: string;
};

type PageIntro = {
  eyebrow: string;
  title: string;
  description: string;
};

export type SiteContent = {
  general: PricingConfig & {
    supportEmail: string;
    supportPhone: string;
    companyLegalName: string;
    businessAddress: string;
    taxOffice: string;
    taxNumber: string;
    campaignText: string;
    paymentNotice: string;
  };
  home: PageIntro & {
    storyTitle: string;
    storyText: string;
    setTitle: string;
    setDescription: string;
    guideItems: InfoItem[];
    trustBadges: InfoItem[];
    reviews: ReviewItem[];
  };
  about: PageIntro & {
    paragraphs: string[];
    cards: InfoItem[];
  };
  shipping: PageIntro & {
    items: InfoItem[];
  };
  returns: PageIntro & {
    items: InfoItem[];
  };
  faq: PageIntro & {
    items: FaqItem[];
  };
  contact: PageIntro & {
    cards: ContactCard[];
    note: string;
  };
  terms: PageIntro & {
    items: InfoItem[];
  };
};

const DATA_FILE = "data/site-content.json";

const fallbackContent: SiteContent = {
  general: {
    supportEmail: brand.supportEmail,
    supportPhone: "+90 850 000 00 00",
    companyLegalName: brand.name,
    businessAddress: "Ataşehir, 34758 İstanbul, Türkiye",
    taxOffice: "",
    taxNumber: "",
    shippingFee: 49,
    freeShippingThreshold: 500,
    bundleSecondPercent: 10,
    bundleThirdPercent: 15,
    campaignText: "2 posterde %10, 3+ posterde %15 set indirimi",
    paymentNotice:
      "Kart bilgileri The Posterist sunucusunda tutulmaz; ödeme PayTR güvenli ödeme ekranı üzerinden tamamlanır.",
  },
  home: {
    eyebrow: "3D lentiküler poster mağazası",
    title: "Açı değiştirdikçe başka bir sanat eseri ortaya çıkar.",
    description:
      "The Posterist, eldeki seçili poster koleksiyonlarını lensli lentiküler baskı deneyimiyle sunar. Satın almadan önce posteri sürükleyerek geçiş etkisini deneyebilirsiniz.",
    storyTitle: "Duvara asılan tek kare değil, hareket eden bir obje.",
    storyText:
      "Her poster A3 sabit ölçüde hazırlanır, görseller arası geçiş kontrol edilir ve korumalı ambalajla gönderilir. Koleksiyonlar hediye, stüdyo, ofis ve ev dekorasyonu için seçili kombinasyonlardan oluşur.",
    setTitle: "Birlikte daha iyi çalışan posterler",
    setDescription:
      "Farklı posterleri beraber alınca indirim otomatik uygulanır. Aynı üründen almak zorunda değilsiniz; koleksiyon hissini büyütmek için farklı eserleri eşleştirebilirsiniz.",
    guideItems: [
      {
        title: "Sürükle",
        text: "Ürün görselini parmakla veya mouse ile sağa sola kaydırıp geçişi deneyin.",
      },
      {
        title: "Set yap",
        text: "İkinci posterde %10, üç ve üzeri posterde %15 indirim otomatik açılır.",
      },
      {
        title: "Güvenle teslim al",
        text: "Posterler sabit A3 ölçüde, çerçevesiz ve korumalı ambalajla gönderilir.",
      },
    ],
    trustBadges: [
      {
        title: "Sabit ölçü",
        text: "Tüm posterler A3 / 29,7 x 42 cm ölçüsünde hazırlanır.",
      },
      {
        title: "Korumalı gönderim",
        text: "Lens yüzeyi çizilmeyi azaltacak paketleme ile korunur.",
      },
      {
        title: "14 gün iade",
        text: "Standart ürünlerde teslimden itibaren 14 gün iade hakkı vardır.",
      },
      {
        title: "PayTR ödeme",
        text: "Canlı satışta kart ödemesi PayTR güvenli ödeme altyapısıyla alınır.",
      },
    ],
    reviews: [
      {
        name: "Ece K.",
        meta: "Ev dekorasyonu",
        text: "Posterin açı değiştirince başka tabloya dönmesi misafirlerin ilk fark ettiği şey oldu.",
      },
      {
        name: "Mert A.",
        meta: "Hediye siparişi",
        text: "Normal posterden daha özel hissettiriyor. Set indirimiyle iki farklı işi birlikte aldım.",
      },
      {
        name: "Studio Nova",
        meta: "Ofis duvarı",
        text: "Minimal tasarımlı alanda hareket hissi verdiği için çok iyi durdu.",
      },
    ],
  },
  about: {
    eyebrow: "Hakkımızda",
    title: "Açı değiştiren posterleri daha erişilebilir hale getiriyoruz.",
    description:
      "The Posterist, klasik sanat ve çağdaş görselleri lentiküler baskı teknolojisiyle yeniden yorumlayan bir poster mağazasıdır.",
    paragraphs: [
      "Amacımız, duvara asılan bir posteri tek kare olmaktan çıkarıp hareketli bir objeye dönüştürmek. Kullanıcı postere farklı açılardan baktığında farklı görseller görür; bu yüzden her ürün baskıdan önce geçiş, kontrast ve okunabilirlik açısından kontrol edilir.",
      "Mağaza deneyiminde de aynı hissi korumak istiyoruz. Ürün sayfalarında posterleri parmakla veya mouse ile sürükleyebilir, fiziksel baskıdaki açı değişimini sipariş vermeden önce deneyebilirsiniz.",
    ],
    cards: [
      {
        title: "Ne satıyoruz?",
        text: "2 veya 3 açılı, lensli 3D lentiküler sanat posterleri.",
      },
      {
        title: "Kime uygun?",
        text: "Ev, ofis, kafe, stüdyo, galeri ve hediye arayan kullanıcılar.",
      },
      {
        title: "Nasıl gönderiyoruz?",
        text: "Çerçevesiz, korumalı ambalajla ve takip bilgisiyle.",
      },
      {
        title: "Neyi önemsiyoruz?",
        text: "Net geçiş, güçlü renk, kolay alışveriş ve güven veren destek.",
      },
    ],
  },
  shipping: {
    eyebrow: "Kargo",
    title: "Posterler korumalı ambalajla ve takip bilgisiyle gönderilir.",
    description:
      "Lentiküler baskı yüzeyi hassas olduğu için üretim sonrası paketleme ve teslimat süreci dikkatle yönetilir.",
    items: [
      {
        title: "Hazırlık süresi",
        text: "Siparişler baskı ve kalite kontrol sürecinden geçerek genellikle 2-4 iş günü içinde kargoya teslim edilir.",
      },
      {
        title: "Paketleme",
        text: "Posterler çizilmeyi ve kıvrılmayı azaltacak korumalı ambalajla gönderilir.",
      },
      {
        title: "Kargo ücreti",
        text: "Belirlenen ücretsiz kargo eşiği üzerindeki siparişlerde kargo ücretsizdir.",
      },
      {
        title: "Teslimat takibi",
        text: "Kargoya verilen her sipariş için takip bilgisi paylaşılır.",
      },
    ],
  },
  returns: {
    eyebrow: "İade ve değişim",
    title: "İade sürecini açık, hızlı ve takip edilebilir tutuyoruz.",
    description:
      "Siparişinizle ilgili bir sorun olduğunda ürün durumunu ve teslimat tarihini birlikte kontrol ederek en uygun çözümü sunarız.",
    items: [
      {
        title: "14 gün iade",
        text: "Standart ürünlerde teslim tarihinden itibaren 14 gün içinde iade talebi oluşturabilirsiniz.",
      },
      {
        title: "Ürün durumu",
        text: "İade edilecek ürün kullanılmamış, zarar görmemiş ve mümkünse orijinal ambalajında olmalıdır.",
      },
      {
        title: "Hasarlı teslimat",
        text: "Kargo hasarı fark ederseniz paketin fotoğrafını çekin ve teslimat günü içinde bizimle iletişime geçin.",
      },
    ],
  },
  faq: {
    eyebrow: "S.S.S.",
    title: "Sipariş vermeden önce akla gelen sorular.",
    description:
      "Lentiküler baskı, teslimat, iade ve toplu siparişler hakkında en sık sorulan konuları burada topladık.",
    items: [
      {
        question: "3D lentiküler poster nedir?",
        answer:
          "Lentiküler poster, farklı açılardan bakıldığında farklı görseller gösteren özel lensli bir baskıdır. The Posterist posterlerinde bu etkiyi satın almadan önce ekranda sürükleyerek deneyebilirsiniz.",
      },
      {
        question: "Posterler çerçeveli mi geliyor?",
        answer:
          "Posterler çerçevesiz ve korumalı ambalajla gönderilir. Standart satış ölçüsü A3 / 29,7 x 42 cm olarak hazırlanır.",
      },
      {
        question: "Kargoya ne zaman verilir?",
        answer:
          "Siparişler üretim yoğunluğuna göre genellikle 2-4 iş günü içinde hazırlanır. Baskı tamamlandıktan sonra takip numarası paylaşılır.",
      },
      {
        question: "İade yapabilir miyim?",
        answer:
          "Standart ürünlerde teslimden itibaren 14 gün içinde iade talebi oluşturabilirsiniz.",
      },
    ],
  },
  contact: {
    eyebrow: "İletişim",
    title: "Sipariş, toplu alım ve destek için bize yazın.",
    description:
      "Canlı satış öncesi destek kanalları burada netleşir. Sipariş ve kargo soruları için bize ulaşabilirsiniz.",
    cards: [
      {
        title: "E-posta",
        value: brand.supportEmail,
        href: `mailto:${brand.supportEmail}`,
      },
      {
        title: "Telefon",
        value: "+90 850 000 00 00",
        href: "tel:+908500000000",
      },
      {
        title: "Instagram",
        value: brand.instagram,
        href: "https://instagram.com/",
      },
    ],
    note:
      "Toplu sipariş taleplerinde adet, teslimat şehri ve kullanılacak alan bilgisini paylaşırsanız daha hızlı dönüş yapabiliriz.",
  },
  terms: {
    eyebrow: "Yasal",
    title: "Mesafeli satış sözleşmesi ve ön bilgilendirme",
    description:
      "theposterist.com üzerinden yapılan satışlara ilişkin tarafların hak ve yükümlülüklerini açıklar.",
    items: [
      {
        title: "1. Satıcı bilgileri",
        text: "Satıcı: The Posterist. İletişim: destek@theposterist.com. Adres ve vergi bilgileri İletişim sayfasında yer alır.",
      },
      {
        title: "2. Sözleşmenin konusu",
        text: "İşbu sözleşme, Alıcının theposterist.com üzerinden elektronik ortamda sipariş verdiği lentiküler poster ürünlerinin satışı ve teslimatına ilişkin 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların hak ve yükümlülüklerini düzenler.",
      },
      {
        title: "3. Ürün ve fiyat",
        text: "Ürünlerin temel nitelikleri, satış fiyatı ve ödeme şekli sipariş özetinde ve ürün sayfasında gösterilir. Fiyatlara KDV dahildir; kargo bedeli sepet aşamasında ayrıca belirtilir.",
      },
      {
        title: "4. Ödeme",
        text: "Ödemeler PayTR güvenli ödeme altyapısı üzerinden kart ile alınır. Kart bilgileri The Posterist sunucularında saklanmaz.",
      },
      {
        title: "5. Teslimat",
        text: "Siparişler baskı ve kalite kontrol sonrası genellikle 2-4 iş günü içinde kargoya verilir. Teslimat süresi kargo firmasına ve teslimat adresine göre değişebilir. Detaylar Kargo sayfasında yer alır.",
      },
      {
        title: "6. Cayma hakkı",
        text: "Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma hakkının kullanımı ve iade koşulları İade sayfasında açıklanmıştır.",
      },
      {
        title: "7. Uyuşmazlık",
        text: "Uyuşmazlık halinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. Alıcı, Ticaret Bakanlığı şikâyet platformunu da kullanabilir.",
      },
    ],
  },
};

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback: number, min = 0, max = Infinity): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function sanitizeInfoItems(value: unknown, fallback: InfoItem[] = []): InfoItem[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => ({
      title: asText((item as InfoItem)?.title),
      text: asText((item as InfoItem)?.text),
    }))
    .filter((item) => item.title || item.text);
}

function sanitizeFaqItems(value: unknown, fallback: FaqItem[] = []): FaqItem[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => ({
      question: asText((item as FaqItem)?.question),
      answer: asText((item as FaqItem)?.answer),
    }))
    .filter((item) => item.question || item.answer);
}

function sanitizeContactCards(
  value: unknown,
  fallback: ContactCard[] = [],
): ContactCard[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => ({
      title: asText((item as ContactCard)?.title),
      value: asText((item as ContactCard)?.value),
      href: asText((item as ContactCard)?.href, "/contact"),
    }))
    .filter((item) => item.title || item.value || item.href);
}

function sanitizeReviews(value: unknown, fallback: ReviewItem[] = []): ReviewItem[] {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => ({
      name: asText((item as ReviewItem)?.name),
      meta: asText((item as ReviewItem)?.meta),
      text: asText((item as ReviewItem)?.text),
    }))
    .filter((item) => item.name || item.meta || item.text);
}

function sanitizeIntro<T extends PageIntro>(
  value: Partial<T> | undefined,
  fallback: T,
): PageIntro {
  return {
    eyebrow: asText(value?.eyebrow, fallback.eyebrow),
    title: asText(value?.title, fallback.title),
    description: asText(value?.description, fallback.description),
  };
}

export function sanitizeSiteContent(input: unknown): SiteContent {
  const value = input as Partial<SiteContent>;

  return {
    general: {
      supportEmail: asText(
        value.general?.supportEmail,
        fallbackContent.general.supportEmail,
      ),
      supportPhone: asText(
        value.general?.supportPhone,
        fallbackContent.general.supportPhone,
      ),
      companyLegalName: asText(
        value.general?.companyLegalName,
        fallbackContent.general.companyLegalName,
      ),
      businessAddress: asText(
        value.general?.businessAddress,
        fallbackContent.general.businessAddress,
      ),
      taxOffice: asText(value.general?.taxOffice, fallbackContent.general.taxOffice),
      taxNumber: asText(value.general?.taxNumber, fallbackContent.general.taxNumber),
      shippingFee: asNumber(
        value.general?.shippingFee,
        fallbackContent.general.shippingFee,
      ),
      freeShippingThreshold: asNumber(
        value.general?.freeShippingThreshold,
        fallbackContent.general.freeShippingThreshold,
      ),
      bundleSecondPercent: asNumber(
        value.general?.bundleSecondPercent,
        fallbackContent.general.bundleSecondPercent,
        0,
        100,
      ),
      bundleThirdPercent: asNumber(
        value.general?.bundleThirdPercent,
        fallbackContent.general.bundleThirdPercent,
        0,
        100,
      ),
      campaignText: asText(
        value.general?.campaignText,
        fallbackContent.general.campaignText,
      ),
      paymentNotice: asText(
        value.general?.paymentNotice ??
          (value.general as { shopierNotice?: string } | undefined)?.shopierNotice,
        fallbackContent.general.paymentNotice,
      ),
    },
    home: {
      ...sanitizeIntro(value.home, fallbackContent.home),
      storyTitle: asText(value.home?.storyTitle, fallbackContent.home.storyTitle),
      storyText: asText(value.home?.storyText, fallbackContent.home.storyText),
      setTitle: asText(value.home?.setTitle, fallbackContent.home.setTitle),
      setDescription: asText(
        value.home?.setDescription,
        fallbackContent.home.setDescription,
      ),
      guideItems: sanitizeInfoItems(
        value.home?.guideItems,
        fallbackContent.home.guideItems,
      ),
      trustBadges: sanitizeInfoItems(
        value.home?.trustBadges,
        fallbackContent.home.trustBadges,
      ),
      reviews: sanitizeReviews(value.home?.reviews, fallbackContent.home.reviews),
    },
    about: {
      ...sanitizeIntro(value.about, fallbackContent.about),
      paragraphs: Array.isArray(value.about?.paragraphs)
        ? value.about.paragraphs.map((item) => asText(item)).filter(Boolean)
        : fallbackContent.about.paragraphs,
      cards: sanitizeInfoItems(value.about?.cards, fallbackContent.about.cards),
    },
    shipping: {
      ...sanitizeIntro(value.shipping, fallbackContent.shipping),
      items: sanitizeInfoItems(value.shipping?.items, fallbackContent.shipping.items),
    },
    returns: {
      ...sanitizeIntro(value.returns, fallbackContent.returns),
      items: sanitizeInfoItems(value.returns?.items, fallbackContent.returns.items),
    },
    faq: {
      ...sanitizeIntro(value.faq, fallbackContent.faq),
      items: sanitizeFaqItems(value.faq?.items, fallbackContent.faq.items),
    },
    contact: {
      ...sanitizeIntro(value.contact, fallbackContent.contact),
      cards: sanitizeContactCards(value.contact?.cards, fallbackContent.contact.cards),
      note: asText(value.contact?.note, fallbackContent.contact.note),
    },
    terms: {
      ...sanitizeIntro(value.terms, fallbackContent.terms),
      items: sanitizeInfoItems(value.terms?.items, fallbackContent.terms.items),
    },
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const raw = await readTextFile(DATA_FILE);
    if (!raw) return fallbackContent;
    return sanitizeSiteContent(JSON.parse(raw));
  } catch {
    return fallbackContent;
  }
}

export async function updateSiteContent(input: unknown): Promise<SiteContent> {
  const content = sanitizeSiteContent(input);
  await writeTextFile(DATA_FILE, `${JSON.stringify(content, null, 2)}\n`);
  return content;
}
