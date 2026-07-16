"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteContent } from "@/lib/site-content";

type ContentEditorProps = {
  initialContent: SiteContent;
};

type SectionKey = keyof SiteContent;
type IntroSectionKey = "home" | "about" | "shipping" | "returns" | "faq" | "contact" | "terms";

const sections: Array<{ key: SectionKey; label: string; href?: string }> = [
  { key: "general", label: "Genel" },
  { key: "home", label: "Ana sayfa", href: "/" },
  { key: "about", label: "Hakkımızda", href: "/about" },
  { key: "shipping", label: "Kargo", href: "/shipping" },
  { key: "returns", label: "İade / Değişim", href: "/returns" },
  { key: "terms", label: "Satış Sözleşmesi", href: "/terms" },
  { key: "faq", label: "S.S.S.", href: "/faq" },
  { key: "contact", label: "İletişim", href: "/contact" },
];

function cloneContent(content: SiteContent): SiteContent {
  return JSON.parse(JSON.stringify(content)) as SiteContent;
}

export function ContentEditor({ initialContent }: ContentEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [active, setActive] = useState<SectionKey>("general");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const mutate = (mutator: (draft: SiteContent) => void) => {
    setContent((current) => {
      const next = cloneContent(current);
      mutator(next);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "İçerik kaydedilemedi.");
      setContent(data.content);
      setMessage("İçerik kaydedildi.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const activeSection = sections.find((section) => section.key === active);

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-[8px] border border-white/10 bg-white/[0.025] p-2 lg:sticky lg:top-6 lg:self-start">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => setActive(section.key)}
            className={`flex w-full items-center justify-between rounded-[8px] px-3 py-3 text-left text-sm transition-colors ${
              active === section.key
                ? "bg-amber-300 text-black"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {section.label}
            {section.href && (
              <span className="text-[10px] opacity-70">
                {section.href === "/" ? "/" : section.href}
              </span>
            )}
          </button>
        ))}
      </aside>

      <section className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.025] p-5">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-amber-300 uppercase">
              İçerik yönetimi
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              {activeSection?.label}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Kaydettiğin içerikler mağaza sayfalarında anında kullanılır.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeSection?.href && (
              <Link
                href={activeSection.href}
                target="_blank"
                className="rounded-[8px] border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:text-white"
              >
                Sayfayı aç
              </Link>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-[8px] bg-amber-300 px-5 py-2 text-sm font-semibold text-black disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>

        {message && (
          <p className="mt-4 rounded-[8px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-[8px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="mt-6">
          {active === "general" && (
            <GeneralEditor content={content} mutate={mutate} />
          )}
          {active === "home" && <HomeEditor content={content} mutate={mutate} />}
          {active === "about" && <AboutEditor content={content} mutate={mutate} />}
          {active === "shipping" && (
            <InfoSectionEditor sectionKey="shipping" content={content} mutate={mutate} />
          )}
          {active === "returns" && (
            <InfoSectionEditor sectionKey="returns" content={content} mutate={mutate} />
          )}
          {active === "terms" && (
            <InfoSectionEditor sectionKey="terms" content={content} mutate={mutate} />
          )}
          {active === "faq" && <FaqEditor content={content} mutate={mutate} />}
          {active === "contact" && (
            <ContactEditor content={content} mutate={mutate} />
          )}
        </div>
      </section>
    </div>
  );
}

function GeneralEditor({
  content,
  mutate,
}: {
  content: SiteContent;
  mutate: (mutator: (draft: SiteContent) => void) => void;
}) {
  return (
    <div className="space-y-8">
      <EditorBlock title="Destek">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Destek e-postası"
            value={content.general.supportEmail}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.supportEmail = value;
              })
            }
          />
          <Field
            label="Destek telefonu"
            value={content.general.supportPhone}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.supportPhone = value;
              })
            }
          />
        </div>
      </EditorBlock>

      <EditorBlock title="Şirket bilgileri (PayTR / yasal)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Ticari unvan"
            value={content.general.companyLegalName}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.companyLegalName = value;
              })
            }
          />
          <Field
            label="Vergi dairesi"
            value={content.general.taxOffice}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.taxOffice = value;
              })
            }
          />
          <Field
            label="Vergi no / TCKN"
            value={content.general.taxNumber}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.taxNumber = value;
              })
            }
          />
        </div>
        <div className="mt-4">
          <TextArea
            label="İşletme adresi"
            value={content.general.businessAddress}
            rows={3}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.businessAddress = value;
              })
            }
          />
        </div>
      </EditorBlock>

      <EditorBlock title="Kampanya ve kargo">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Kargo ücreti"
            value={content.general.shippingFee}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.shippingFee = value;
              })
            }
          />
          <NumberField
            label="Ücretsiz kargo eşiği"
            value={content.general.freeShippingThreshold}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.freeShippingThreshold = value;
              })
            }
          />
          <NumberField
            label="2 ürün indirimi (%)"
            value={content.general.bundleSecondPercent}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.bundleSecondPercent = value;
              })
            }
          />
          <NumberField
            label="3+ ürün indirimi (%)"
            value={content.general.bundleThirdPercent}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.bundleThirdPercent = value;
              })
            }
          />
        </div>
        <div className="mt-4 grid gap-4">
          <Field
            label="Kampanya metni"
            value={content.general.campaignText}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.campaignText = value;
              })
            }
          />
          <TextArea
            label="PayTR ödeme notu"
            value={content.general.paymentNotice}
            rows={3}
            onChange={(value) =>
              mutate((draft) => {
                draft.general.paymentNotice = value;
              })
            }
          />
        </div>
      </EditorBlock>
    </div>
  );
}

function PageIntroEditor({
  sectionKey,
  content,
  mutate,
}: {
  sectionKey: IntroSectionKey;
  content: SiteContent;
  mutate: (mutator: (draft: SiteContent) => void) => void;
}) {
  const section = content[sectionKey];

  return (
    <div className="grid gap-4">
      <Field
        label="Üst etiket"
        value={section.eyebrow}
        onChange={(value) =>
          mutate((draft) => {
            draft[sectionKey].eyebrow = value;
          })
        }
      />
      <Field
        label="Başlık"
        value={section.title}
        onChange={(value) =>
          mutate((draft) => {
            draft[sectionKey].title = value;
          })
        }
      />
      <TextArea
        label="Açıklama"
        value={section.description}
        rows={3}
        onChange={(value) =>
          mutate((draft) => {
            draft[sectionKey].description = value;
          })
        }
      />
    </div>
  );
}

function HomeEditor({
  content,
  mutate,
}: {
  content: SiteContent;
  mutate: (mutator: (draft: SiteContent) => void) => void;
}) {
  return (
    <div className="space-y-8">
      <PageIntroEditor sectionKey="home" content={content} mutate={mutate} />

      <EditorBlock title="Hikaye bölümü">
        <div className="grid gap-4">
          <Field
            label="Hikaye başlığı"
            value={content.home.storyTitle}
            onChange={(value) =>
              mutate((draft) => {
                draft.home.storyTitle = value;
              })
            }
          />
          <TextArea
            label="Hikaye metni"
            value={content.home.storyText}
            rows={4}
            onChange={(value) =>
              mutate((draft) => {
                draft.home.storyText = value;
              })
            }
          />
          <Field
            label="Set başlığı"
            value={content.home.setTitle}
            onChange={(value) =>
              mutate((draft) => {
                draft.home.setTitle = value;
              })
            }
          />
          <TextArea
            label="Set açıklaması"
            value={content.home.setDescription}
            rows={3}
            onChange={(value) =>
              mutate((draft) => {
                draft.home.setDescription = value;
              })
            }
          />
        </div>
      </EditorBlock>

      <InfoItemsEditor
        title="Nasıl çalışır adımları"
        items={content.home.guideItems}
        onAdd={() =>
          mutate((draft) => {
            draft.home.guideItems.push({ title: "", text: "" });
          })
        }
        onRemove={(index) =>
          mutate((draft) => {
            draft.home.guideItems.splice(index, 1);
          })
        }
        onChange={(index, field, value) =>
          mutate((draft) => {
            draft.home.guideItems[index][field] = value;
          })
        }
      />

      <InfoItemsEditor
        title="Güven rozetleri"
        items={content.home.trustBadges}
        onAdd={() =>
          mutate((draft) => {
            draft.home.trustBadges.push({ title: "", text: "" });
          })
        }
        onRemove={(index) =>
          mutate((draft) => {
            draft.home.trustBadges.splice(index, 1);
          })
        }
        onChange={(index, field, value) =>
          mutate((draft) => {
            draft.home.trustBadges[index][field] = value;
          })
        }
      />

      <ReviewEditor content={content} mutate={mutate} />
    </div>
  );
}

function AboutEditor({
  content,
  mutate,
}: {
  content: SiteContent;
  mutate: (mutator: (draft: SiteContent) => void) => void;
}) {
  return (
    <div className="space-y-8">
      <PageIntroEditor sectionKey="about" content={content} mutate={mutate} />

      <EditorBlock title="Paragraflar">
        <div className="space-y-3">
          {content.about.paragraphs.map((paragraph, index) => (
            <RowShell
              key={index}
              onRemove={() =>
                mutate((draft) => {
                  draft.about.paragraphs.splice(index, 1);
                })
              }
            >
              <TextArea
                label={`Paragraf ${index + 1}`}
                value={paragraph}
                rows={4}
                onChange={(value) =>
                  mutate((draft) => {
                    draft.about.paragraphs[index] = value;
                  })
                }
              />
            </RowShell>
          ))}
          <AddButton
            label="Paragraf ekle"
            onClick={() =>
              mutate((draft) => {
                draft.about.paragraphs.push("");
              })
            }
          />
        </div>
      </EditorBlock>

      <InfoItemsEditor
        title="Hakkımızda kartları"
        items={content.about.cards}
        onAdd={() =>
          mutate((draft) => {
            draft.about.cards.push({ title: "", text: "" });
          })
        }
        onRemove={(index) =>
          mutate((draft) => {
            draft.about.cards.splice(index, 1);
          })
        }
        onChange={(index, field, value) =>
          mutate((draft) => {
            draft.about.cards[index][field] = value;
          })
        }
      />
    </div>
  );
}

function InfoSectionEditor({
  sectionKey,
  content,
  mutate,
}: {
  sectionKey: "shipping" | "returns" | "terms";
  content: SiteContent;
  mutate: (mutator: (draft: SiteContent) => void) => void;
}) {
  return (
    <div className="space-y-8">
      <PageIntroEditor sectionKey={sectionKey} content={content} mutate={mutate} />
      <InfoItemsEditor
        title="Bilgi kutuları"
        items={content[sectionKey].items}
        onAdd={() =>
          mutate((draft) => {
            draft[sectionKey].items.push({ title: "", text: "" });
          })
        }
        onRemove={(index) =>
          mutate((draft) => {
            draft[sectionKey].items.splice(index, 1);
          })
        }
        onChange={(index, field, value) =>
          mutate((draft) => {
            draft[sectionKey].items[index][field] = value;
          })
        }
      />
    </div>
  );
}

function FaqEditor({
  content,
  mutate,
}: {
  content: SiteContent;
  mutate: (mutator: (draft: SiteContent) => void) => void;
}) {
  return (
    <div className="space-y-8">
      <PageIntroEditor sectionKey="faq" content={content} mutate={mutate} />

      <EditorBlock title="Sorular">
        <div className="space-y-3">
          {content.faq.items.map((item, index) => (
            <RowShell
              key={index}
              onRemove={() =>
                mutate((draft) => {
                  draft.faq.items.splice(index, 1);
                })
              }
            >
              <Field
                label="Soru"
                value={item.question}
                onChange={(value) =>
                  mutate((draft) => {
                    draft.faq.items[index].question = value;
                  })
                }
              />
              <TextArea
                label="Cevap"
                value={item.answer}
                rows={4}
                onChange={(value) =>
                  mutate((draft) => {
                    draft.faq.items[index].answer = value;
                  })
                }
              />
            </RowShell>
          ))}
          <AddButton
            label="Soru ekle"
            onClick={() =>
              mutate((draft) => {
                draft.faq.items.push({ question: "", answer: "" });
              })
            }
          />
        </div>
      </EditorBlock>
    </div>
  );
}

function ContactEditor({
  content,
  mutate,
}: {
  content: SiteContent;
  mutate: (mutator: (draft: SiteContent) => void) => void;
}) {
  return (
    <div className="space-y-8">
      <PageIntroEditor sectionKey="contact" content={content} mutate={mutate} />

      <EditorBlock title="İletişim kartları">
        <div className="space-y-3">
          {content.contact.cards.map((card, index) => (
            <RowShell
              key={index}
              onRemove={() =>
                mutate((draft) => {
                  draft.contact.cards.splice(index, 1);
                })
              }
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Field
                  label="Başlık"
                  value={card.title}
                  onChange={(value) =>
                    mutate((draft) => {
                      draft.contact.cards[index].title = value;
                    })
                  }
                />
                <Field
                  label="Değer"
                  value={card.value}
                  onChange={(value) =>
                    mutate((draft) => {
                      draft.contact.cards[index].value = value;
                    })
                  }
                />
                <Field
                  label="Link"
                  value={card.href}
                  onChange={(value) =>
                    mutate((draft) => {
                      draft.contact.cards[index].href = value;
                    })
                  }
                />
              </div>
            </RowShell>
          ))}
          <AddButton
            label="Kart ekle"
            onClick={() =>
              mutate((draft) => {
                draft.contact.cards.push({ title: "", value: "", href: "/contact" });
              })
            }
          />
        </div>
      </EditorBlock>

      <TextArea
        label="Alt bilgilendirme kutusu"
        value={content.contact.note}
        rows={4}
        onChange={(value) =>
          mutate((draft) => {
            draft.contact.note = value;
          })
        }
      />
    </div>
  );
}

function ReviewEditor({
  content,
  mutate,
}: {
  content: SiteContent;
  mutate: (mutator: (draft: SiteContent) => void) => void;
}) {
  return (
    <EditorBlock title="Yorumlar">
      <div className="space-y-3">
        {content.home.reviews.map((review, index) => (
          <RowShell
            key={index}
            onRemove={() =>
              mutate((draft) => {
                draft.home.reviews.splice(index, 1);
              })
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="İsim"
                value={review.name}
                onChange={(value) =>
                  mutate((draft) => {
                    draft.home.reviews[index].name = value;
                  })
                }
              />
              <Field
                label="Kısa bilgi"
                value={review.meta}
                onChange={(value) =>
                  mutate((draft) => {
                    draft.home.reviews[index].meta = value;
                  })
                }
              />
            </div>
            <TextArea
              label="Yorum"
              value={review.text}
              rows={3}
              onChange={(value) =>
                mutate((draft) => {
                  draft.home.reviews[index].text = value;
                })
              }
            />
          </RowShell>
        ))}
        <AddButton
          label="Yorum ekle"
          onClick={() =>
            mutate((draft) => {
              draft.home.reviews.push({ name: "", meta: "", text: "" });
            })
          }
        />
      </div>
    </EditorBlock>
  );
}

function InfoItemsEditor({
  title,
  items,
  onAdd,
  onRemove,
  onChange,
}: {
  title: string;
  items: Array<{ title: string; text: string }>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: "title" | "text", value: string) => void;
}) {
  return (
    <EditorBlock title={title}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <RowShell key={index} onRemove={() => onRemove(index)}>
            <Field
              label="Başlık"
              value={item.title}
              onChange={(value) => onChange(index, "title", value)}
            />
            <TextArea
              label="Metin"
              value={item.text}
              rows={3}
              onChange={(value) => onChange(index, "text", value)}
            />
          </RowShell>
        ))}
        <AddButton label="Kutu ekle" onClick={onAdd} />
      </div>
    </EditorBlock>
  );
}

function EditorBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold tracking-[0.18em] text-zinc-500 uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function RowShell({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-black/20 p-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="rounded border border-red-400/20 px-2 py-1 text-[11px] text-red-300 hover:bg-red-400/10"
        >
          Sil
        </button>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-[8px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-amber-300/40"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full rounded-[8px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-amber-300/40"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full resize-y rounded-[8px] border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm leading-6 text-white outline-none focus:border-amber-300/40"
      />
    </label>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[8px] border border-dashed border-white/15 px-4 py-2.5 text-sm text-zinc-300 hover:border-amber-300/30 hover:text-white"
    >
      + {label}
    </button>
  );
}
