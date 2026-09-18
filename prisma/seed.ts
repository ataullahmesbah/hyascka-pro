/* eslint-disable no-console */
import { PrismaClient, type Prisma } from "@prisma/client";

import { seedDemoData } from "./demo-data";
import bcrypt from "bcryptjs";

import { serviceCategories, services } from "../src/content/services";
import {
  caseStudies,
  faqs,
  industries,
  navigation,
  posts,
  team,
  testimonials,
} from "../src/content/marketing";
import {
  defaultBrand,
  defaultContact,
  defaultFeatureFlags,
  defaultLocalization,
  defaultMaintenance,
  defaultNotifications,
  defaultSeo,
  defaultSocial,
  defaultTheme,
  defaultTracking,
  homepage,
} from "../src/content/site";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@hyascka.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe#2026";

function ref(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

async function main() {
  console.log("→ Seeding HYASCKA…");
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // ---- Users, one per role so every dashboard can be reviewed -------------
  const staff = [
    { email: ADMIN_EMAIL, name: "Ataullah Mesbah", role: "SUPER_ADMIN" as const },
    { email: "admin.demo@hyascka.com", name: "Rifat Khan", role: "ADMIN" as const },
    { email: "finance@hyascka.com", name: "Nabila Haque", role: "FINANCE" as const },
    { email: "pm@hyascka.com", name: "Maria Islam", role: "PROJECT_MANAGER" as const },
    { email: "editor@hyascka.com", name: "Anika Sultana", role: "EDITOR" as const },
    { email: "support@hyascka.com", name: "Shafin Ahmed", role: "SUPPORT" as const },
  ];

  const users = new Map<string, string>();
  for (const person of staff) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: { name: person.name, role: person.role },
      create: {
        email: person.email,
        name: person.name,
        role: person.role,
        passwordHash,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
    users.set(person.role, user.id);
  }
  console.log(`  ✓ ${staff.length} staff accounts`);

  // ---- Demo clients -------------------------------------------------------
  const clientSeeds = [
    { email: "client@northlane.example", name: "Farhana Rahman", company: "Northlane Systems" },
    { email: "client@maisonrouge.example", name: "Imran Chowdhury", company: "Maison Rouge" },
    { email: "client@vireo.example", name: "Nusrat Jahan", company: "Vireo Health Group" },
  ];

  const clients: { userId: string; profileId: string; company: string }[] = [];
  for (const [index, seed] of clientSeeds.entries()) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: { name: seed.name },
      create: {
        email: seed.email,
        name: seed.name,
        role: "CLIENT",
        passwordHash,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
    const profile = await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: { companyName: seed.company },
      create: {
        userId: user.id,
        companyName: seed.company,
        billingEmail: seed.email,
        city: "Dhaka",
        country: "Bangladesh",
        onboardedAt: new Date(),
        referralCode: `HY-${seed.company.slice(0, 3).toUpperCase()}${index + 1}`,
      },
    });
    clients.push({ userId: user.id, profileId: profile.id, company: seed.company });
  }
  console.log(`  ✓ ${clients.length} client accounts`);

  // ---- Service catalogue --------------------------------------------------
  const categoryIds = new Map<string, string>();
  for (const category of serviceCategories) {
    const row = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, position: category.position },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        icon: category.icon,
        position: category.position,
      },
    });
    categoryIds.set(category.slug, row.id);
  }

  const serviceIds = new Map<string, string>();
  for (const service of services) {
    const row = await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        title: service.title,
        tagline: service.tagline,
        shortDescription: service.shortDescription,
        longDescription: service.longDescription,
        position: service.position,
        featured: service.featured,
      },
      create: {
        slug: service.slug,
        title: service.title,
        categoryId: categoryIds.get(service.categorySlug),
        tagline: service.tagline,
        shortDescription: service.shortDescription,
        longDescription: service.longDescription,
        icon: service.icon,
        deliverables: service.deliverables,
        technologies: service.technologies,
        processSteps: service.processSteps as unknown as Prisma.InputJsonValue,
        timeline: service.timeline,
        pricingModel: service.pricingModel,
        startingPrice: service.startingPrice ?? undefined,
        currency: service.currency,
        featured: service.featured,
        position: service.position,
        metaTitle: `${service.title} Services`,
        metaDescription: service.shortDescription.slice(0, 155),
      },
    });
    serviceIds.set(service.slug, row.id);

    await prisma.serviceFeature.deleteMany({ where: { serviceId: row.id } });
    await prisma.serviceFeature.createMany({
      data: service.features.map((feature, index) => ({
        serviceId: row.id,
        title: feature.title,
        detail: feature.detail,
        position: index,
      })),
    });

    await prisma.serviceFAQ.deleteMany({ where: { serviceId: row.id } });
    await prisma.serviceFAQ.createMany({
      data: service.faqs.map((faq, index) => ({
        serviceId: row.id,
        question: faq.question,
        answer: faq.answer,
        position: index,
      })),
    });

    await prisma.servicePackage.deleteMany({ where: { serviceId: row.id } });
    if (service.packages?.length) {
      await prisma.servicePackage.createMany({
        data: service.packages.map((pkg, index) => ({
          serviceId: row.id,
          name: pkg.name,
          summary: pkg.summary,
          price: pkg.price ?? undefined,
          currency: service.currency,
          pricingModel: pkg.pricingModel,
          billingCycle: pkg.billingCycle,
          features: pkg.features,
          highlighted: pkg.highlighted ?? false,
          position: index,
        })),
      });
    }
  }
  console.log(`  ✓ ${services.length} services`);

  // ---- Marketing content --------------------------------------------------
  for (const study of caseStudies) {
    await prisma.caseStudy.upsert({
      where: { slug: study.slug },
      update: { title: study.title, summary: study.summary, position: study.position },
      create: {
        slug: study.slug,
        title: study.title,
        client: study.client,
        industry: study.industry,
        summary: study.summary,
        challenge: study.challenge,
        solution: study.solution,
        outcome: study.outcome,
        metrics: study.metrics as unknown as Prisma.InputJsonValue,
        services: study.services,
        featured: study.featured,
        position: study.position,
        metaTitle: study.title,
        metaDescription: study.summary.slice(0, 155),
      },
    });
  }

  for (const industry of industries) {
    await prisma.industry.upsert({
      where: { slug: industry.slug },
      update: { name: industry.name, headline: industry.headline },
      create: {
        slug: industry.slug,
        name: industry.name,
        headline: industry.headline,
        description: industry.description,
        challenges: industry.challenges,
        solutions: industry.solutions,
        icon: industry.icon,
        position: industry.position,
      },
    });
  }

  await prisma.testimonial.deleteMany({});
  await prisma.testimonial.createMany({
    data: testimonials.map((t) => ({
      author: t.author,
      role: t.role,
      company: t.company,
      quote: t.quote,
      rating: t.rating,
      position: t.position,
    })),
  });

  await prisma.fAQ.deleteMany({});
  await prisma.fAQ.createMany({
    data: faqs.map((f) => ({
      question: f.question,
      answer: f.answer,
      category: f.category,
      position: f.position,
    })),
  });

  await prisma.teamMember.deleteMany({});
  await prisma.teamMember.createMany({ data: team });

  await prisma.navigationItem.deleteMany({});
  await prisma.navigationItem.createMany({ data: navigation });

  const editorId = users.get("EDITOR");
  for (const post of posts) {
    const category = await prisma.category.upsert({
      where: { slug: post.categorySlug },
      update: {},
      create: { slug: post.categorySlug, name: post.categoryName },
    });
    const created = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage ?? null,
        readMinutes: post.readMinutes,
        publishedAt: new Date(post.publishedAt),
        metaTitle: post.title,
        metaDescription: post.excerpt.slice(0, 155),
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage ?? null,
        categoryId: category.id,
        authorId: editorId,
        readMinutes: post.readMinutes,
        status: "PUBLISHED",
        publishedAt: new Date(post.publishedAt),
        metaTitle: post.title,
        metaDescription: post.excerpt.slice(0, 155),
      },
    });
    for (const tagSlug of post.tags) {
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: { slug: tagSlug, name: tagSlug.replace(/-/g, " ") },
      });
      await prisma.blogPostTag.upsert({
        where: { postId_tagId: { postId: created.id, tagId: tag.id } },
        update: {},
        create: { postId: created.id, tagId: tag.id },
      });
    }
  }
  console.log(`  ✓ marketing content (${caseStudies.length} case studies, ${posts.length} posts)`);

  // ---- Homepage sections (CMS-editable) -----------------------------------
  const homePage = await prisma.page.upsert({
    where: { slug: "home" },
    update: {},
    create: {
      slug: "home",
      title: "Homepage",
      metaTitle: defaultSeo.defaultTitle,
      metaDescription: defaultSeo.defaultDescription,
    },
  });

  const sections: { key: string; type: string; title: string; data: unknown }[] = [
    { key: "announcement", type: "announcement", title: "Announcement strip", data: homepage.announcement },
    { key: "hero", type: "hero", title: "Hero", data: homepage.hero },
    { key: "capabilities", type: "rail", title: "Capability rail", data: homepage.capabilities },
    { key: "whyUs", type: "bento", title: "Why HYASCKA", data: homepage.whyUs },
    { key: "process", type: "timeline", title: "Process", data: homepage.process },
    { key: "metrics", type: "metrics", title: "Metrics", data: homepage.metrics },
    { key: "finalCta", type: "cta", title: "Final CTA", data: homepage.finalCta },
  ];

  for (const [index, section] of sections.entries()) {
    await prisma.pageSection.upsert({
      where: { pageId_key: { pageId: homePage.id, key: section.key } },
      update: { data: section.data as Prisma.InputJsonValue },
      create: {
        pageId: homePage.id,
        key: section.key,
        type: section.type,
        title: section.title,
        data: section.data as Prisma.InputJsonValue,
        position: index,
      },
    });
  }

  // ---- Settings, flags, payment methods, tracking, maintenance ------------
  const settings: Record<string, unknown> = {
    brand: defaultBrand,
    theme: defaultTheme,
    contact: defaultContact,
    social: defaultSocial,
    seo: defaultSeo,
    tracking: defaultTracking,
    maintenance: defaultMaintenance,
    notifications: defaultNotifications,
    localization: defaultLocalization,
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue },
      create: { key, value: value as Prisma.InputJsonValue },
    });
  }

  for (const flag of defaultFeatureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { description: flag.description },
      create: flag,
    });
  }

  const paymentMethods = [
    {
      method: "BKASH" as const,
      label: "bKash",
      isActive: true,
      accountNumber: "01700-000000",
      instructions:
        "Send the invoice amount to the bKash number above using Send Money, then submit the Transaction ID (TrxID) from your confirmation SMS.",
      position: 1,
    },
    {
      method: "NAGAD" as const,
      label: "Nagad",
      isActive: true,
      accountNumber: "01700-000000",
      instructions:
        "Send the invoice amount to the Nagad number above, then submit the Transaction ID shown in your Nagad app.",
      position: 2,
    },
    {
      method: "BANK_TRANSFER" as const,
      label: "Bank Transfer",
      isActive: true,
      accountName: "HYASCKA Digital Ltd.",
      accountNumber: "0000 1234 5678 90",
      branch: "Gulshan Branch, Dhaka",
      instructions:
        "Transfer to the account above and submit the bank reference number. Transfers usually clear within one working day.",
      position: 3,
    },
    {
      method: "SSLCOMMERZ" as const,
      label: "Card / SSLCommerz",
      isActive: false,
      instructions: "Pay by card. Payment is confirmed from the gateway webhook, not the browser.",
      position: 4,
    },
  ];
  for (const config of paymentMethods) {
    await prisma.paymentMethodConfig.upsert({
      where: { method: config.method },
      update: { label: config.label, instructions: config.instructions },
      create: config,
    });
  }

  await prisma.maintenanceNotice.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", bannerText: "", isBannerActive: false, isFullModeActive: false },
  });

  await prisma.trackingConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const integrations = [
    { key: "resend", name: "Resend", category: "Email" },
    { key: "telegram", name: "Telegram Bot", category: "Notifications" },
    { key: "cloudinary", name: "Cloudinary", category: "Storage" },
    { key: "upstash", name: "Upstash Redis", category: "Infrastructure" },
    { key: "qstash", name: "Upstash QStash", category: "Jobs" },
    { key: "sentry", name: "Sentry", category: "Monitoring" },
    { key: "ga4", name: "Google Analytics 4", category: "Analytics" },
    { key: "meta_capi", name: "Meta Conversions API", category: "Analytics" },
  ];
  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { key: integration.key },
      update: { name: integration.name },
      create: integration,
    });
  }

  // ---- Finance accounts ---------------------------------------------------
  const accounts = [
    { name: "Business Bank Account", type: "BANK" },
    { name: "bKash Merchant", type: "MOBILE_WALLET" },
    { name: "Nagad Merchant", type: "MOBILE_WALLET" },
    { name: "Petty Cash", type: "CASH" },
  ];
  const accountIds: string[] = [];
  for (const account of accounts) {
    const existing = await prisma.account.findFirst({ where: { name: account.name } });
    const row = existing
      ? existing
      : await prisma.account.create({ data: { name: account.name, type: account.type } });
    accountIds.push(row.id);
  }

  // ---- Demo operational data ---------------------------------------------
  const existingLeads = await prisma.lead.count();
  if (existingLeads === 0) {
    const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON"] as const;
    await prisma.lead.createMany({
      data: leadStatuses.map((status, index) => ({
        reference: ref("LEAD", index + 1),
        name: ["Sabbir Hossain", "Rumana Akter", "Kamal Uddin", "Tasnia Rahman", "Jahid Hasan"][index],
        email: `lead${index + 1}@example.com`,
        phone: "+8801571083401",
        company: ["Bright Retail", "Skyline Estates", "Orbit Fintech", "Cadence Studio", "Nexa Foods"][index],
        budget: ["100k–200k", "200k–400k", "50k–100k", "400k+", "200k–400k"][index],
        message:
          "We are looking for help with our website and search visibility. Please get in touch to discuss scope and timeline.",
        status,
        source: ["website", "referral", "google", "linkedin", "website"][index],
        serviceId: serviceIds.get(index % 2 === 0 ? "web-development" : "seo"),
        ownerId: users.get("ADMIN"),
      })),
    });

    for (const [index, client] of clients.entries()) {
      const service = services[index % services.length];
      const project = await prisma.project.create({
        data: {
          reference: ref("PRJ", index + 1),
          clientId: client.profileId,
          serviceId: serviceIds.get(service.slug),
          name: `${client.company} — ${service.title}`,
          slug: `${client.company.toLowerCase().replace(/\s+/g, "-")}-${service.slug}`,
          summary: `Delivery of ${service.title.toLowerCase()} for ${client.company}.`,
          status: (["IN_PROGRESS", "REVIEW", "PLANNING"] as const)[index],
          progress: [62, 85, 15][index],
          startDate: new Date(Date.now() - 45 * 864e5),
          dueDate: new Date(Date.now() + 30 * 864e5),
          budget: 350000,
          members: {
            create: [
              { userId: users.get("PROJECT_MANAGER")!, roleLabel: "Project Manager" },
              { userId: users.get("ADMIN")!, roleLabel: "Engineering" },
            ],
          },
          milestones: {
            create: [
              { title: "Discovery & architecture", status: "COMPLETED", position: 0 },
              { title: "Design system", status: "COMPLETED", position: 1 },
              { title: "Build", status: "IN_PROGRESS", position: 2 },
              { title: "Launch", status: "PENDING", position: 3 },
            ],
          },
        },
      });

      await prisma.task.createMany({
        data: [
          { projectId: project.id, title: "Component library setup", status: "DONE", priority: "HIGH" },
          { projectId: project.id, title: "Homepage template", status: "IN_PROGRESS", priority: "HIGH" },
          { projectId: project.id, title: "Analytics + consent wiring", status: "TODO", priority: "MEDIUM" },
          { projectId: project.id, title: "Accessibility audit", status: "TODO", priority: "MEDIUM" },
        ],
      });

      await prisma.projectActivity.create({
        data: {
          projectId: project.id,
          actorId: users.get("PROJECT_MANAGER"),
          action: "project.created",
          detail: "Project created and kickoff scheduled.",
        },
      });

      // Invoice + payment
      const invoice = await prisma.invoice.create({
        data: {
          number: ref("INV", index + 1),
          clientId: client.profileId,
          status: index === 0 ? "PAID" : index === 1 ? "ISSUED" : "OVERDUE",
          issueDate: new Date(Date.now() - (index + 1) * 15 * 864e5),
          dueDate: new Date(Date.now() + (index === 2 ? -10 : 12) * 864e5),
          issuedAt: new Date(Date.now() - (index + 1) * 15 * 864e5),
          paidAt: index === 0 ? new Date() : null,
          subtotal: 1500,
          tax: 27000,
          total: 1725,
          amountPaid: index === 0 ? 207000 : 0,
          notes: "Milestone 1 of the agreed statement of work.",
          items: {
            create: [
              {
                description: `${service.title} — milestone 1`,
                quantity: 1,
                unitPrice: 1500,
                taxRate: 15,
                total: 1725,
              },
            ],
          },
        },
      });

      if (index === 0) {
        const payment = await prisma.payment.create({
          data: {
            reference: ref("PAY", index + 1),
            invoiceId: invoice.id,
            method: "BKASH",
            amount: 1725,
            trxId: `TRX${Date.now()}${index}`,
            status: "VERIFIED",
            submittedById: client.userId,
            verifiedById: users.get("FINANCE"),
            verifiedAt: new Date(),
          },
        });
        await prisma.transaction.create({
          data: {
            reference: ref("TXN", index + 1),
            accountId: accountIds[1],
            type: "INCOME",
            amount: 1725,
            description: `Payment received for ${invoice.number}`,
            relatedType: "Payment",
            relatedId: payment.id,
          },
        });
      }

      if (index === 1) {
        await prisma.payment.create({
          data: {
            reference: ref("PAY", 10 + index),
            invoiceId: invoice.id,
            method: "NAGAD",
            amount: 850,
            trxId: `TRXPENDING${index}`,
            status: "PENDING_VERIFICATION",
            submittedById: client.userId,
            senderNumber: "01700-000000",
          },
        });
      }

      // Conversation
      const conversation = await prisma.conversation.create({
        data: {
          subject: `${client.company} — project updates`,
          clientUserId: client.userId,
          projectId: project.id,
          participants: {
            create: [
              { userId: client.userId },
              { userId: users.get("PROJECT_MANAGER")! },
            ],
          },
        },
      });
      await prisma.message.createMany({
        data: [
          {
            conversationId: conversation.id,
            senderId: users.get("PROJECT_MANAGER")!,
            body: "Kickoff notes are in your Documents tab. First demo is scheduled for Thursday.",
          },
          {
            conversationId: conversation.id,
            senderId: client.userId,
            body: "Thanks — Thursday works. Can we review the analytics plan in the same session?",
          },
        ],
      });

      await prisma.supportTicket.create({
        data: {
          reference: ref("TKT", index + 1),
          clientId: client.profileId,
          subject: index === 0 ? "Add a second admin user" : "Question about invoice tax line",
          category: index === 0 ? "ACCOUNT" : "BILLING",
          status: index === 0 ? "RESOLVED" : "OPEN",
          assigneeId: users.get("SUPPORT"),
          messages: {
            create: [
              {
                authorId: client.userId,
                body:
                  index === 0
                    ? "Could you add our marketing manager as a second user on the account?"
                    : "The last invoice shows a 15% tax line — could you confirm what that covers?",
              },
            ],
          },
        },
      });
    }

    await prisma.expense.createMany({
      data: [
        {
          reference: ref("EXP", 1),
          category: "Software",
          vendor: "Vercel",
          description: "Hosting — monthly",
          amount: 2400,
          status: "APPROVED",
          approvedById: users.get("FINANCE"),
          approvedAt: new Date(),
        },
        {
          reference: ref("EXP", 2),
          category: "Advertising",
          vendor: "Google Ads",
          description: "Brand campaign",
          amount: 300,
          status: "SUBMITTED",
        },
      ],
    });

    console.log("  ✓ demo operational data (leads, projects, invoices, payments, messages)");
  }

  // ---- Welcome notifications ---------------------------------------------
  const superAdminId = users.get("SUPER_ADMIN")!;
  const existingNotifications = await prisma.notification.count({ where: { userId: superAdminId } });
  if (existingNotifications === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: superAdminId,
          type: "SYSTEM_ALERT",
          title: "Welcome to HYASCKA",
          body: "Your platform is seeded and ready. Start in Settings to set your brand, payment methods and tracking IDs.",
          href: "/dashboard/settings",
        },
        {
          userId: superAdminId,
          type: "PAYMENT_RECEIVED",
          title: "Payment pending verification",
          body: "A Nagad payment of ৳100,000 is waiting for finance verification.",
          href: "/dashboard/finance/payments",
        },
      ],
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: superAdminId,
      actorRole: "SUPER_ADMIN",
      action: "system.seed",
      entityType: "System",
      summary: "Database seeded with default catalogue, content and settings.",
    },
  });

  // Fill every dashboard surface so nothing renders empty (PRD §6.8).
  await seedDemoData(prisma);

  console.log("\n✅ Seed complete.");
  console.log(`   Super Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log("   Client demo: client@northlane.example / (same password)");
  console.log("   ⚠  Change every seeded password before deploying to production.\n");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
