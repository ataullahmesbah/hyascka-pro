/* eslint-disable no-console */
import { PrismaClient, type Prisma } from "@prisma/client";

/**
 * Demo data (PRD §6.8).
 *
 * Fills every dashboard surface with ordinary, editable rows so nothing renders
 * empty on first login. These are normal records — edit, update and delete all
 * behave exactly as they do on real data.
 */
export async function seedDemoData(prisma: PrismaClient) {
  const ref = (prefix: string, n: number) => `${prefix}-${String(n).padStart(4, "0")}`;
  const daysAgo = (n: number) => new Date(Date.now() - n * 864e5);

  const users = await prisma.user.findMany({ select: { id: true, role: true, name: true } });
  const byRole = (role: string) => users.find((u) => u.role === role)?.id;
  const staffIds = users.filter((u) => u.role !== "CLIENT").map((u) => u.id);

  const superAdmin = byRole("SUPER_ADMIN")!;
  const admin = byRole("ADMIN") ?? superAdmin;
  const finance = byRole("FINANCE") ?? superAdmin;
  const pm = byRole("PROJECT_MANAGER") ?? superAdmin;
  const support = byRole("SUPPORT") ?? superAdmin;

  const services = await prisma.service.findMany({ select: { id: true, slug: true, title: true } });
  const serviceBySlug = new Map(services.map((s) => [s.slug, s]));

  // ---- More leads across the whole pipeline -------------------------------
  const existingLeads = await prisma.lead.count();
  if (existingLeads < 12) {
    const people = [
      ["Sadia Rahman", "Lumen Interiors", "QUALIFIED", "200k–400k", "web-development", "google"],
      ["Tanvir Ahmed", "Ferro Logistics", "NEW", "400k+", "ai-automation", "referral"],
      ["Nabila Karim", "PureLeaf Organics", "CONTACTED", "100k–200k", "ecommerce-development", "website"],
      ["Mahin Rahat", "Vertex Legal", "PROPOSAL_SENT", "200k–400k", "seo", "linkedin"],
      ["Rezaul Karim", "Novo Clinics", "WON", "400k+", "local-seo", "referral"],
      ["Farzana Islam", "Bluewave Travel", "LOST", "Under 100k", "social-media-marketing", "website"],
      ["Imtiaz Hossain", "Corex Manufacturing", "NEW", "Not sure yet", "technical-seo", "google"],
      ["Sumaiya Akter", "Petal & Co", "CONTACTED", "100k–200k", "graphic-design", "instagram"],
      ["Arif Chowdhury", "Stratus Cloud", "QUALIFIED", "400k+", "digital-marketing", "website"],
      ["Nusrat Zahan", "Halcyon Spa", "NEW", "Under 100k", "web-development", "facebook"],
    ] as const;

    await prisma.lead.createMany({
      data: people.map(([name, company, status, budget, slug, source], index) => ({
        reference: ref("LEAD", index + 10),
        name,
        email: `${name.split(" ")[0].toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, "")}.example`,
        phone: `+8801${700000000 + index * 137}`,
        company,
        budget,
        message: `We are looking at ${serviceBySlug.get(slug)?.title ?? "your services"} and would like to understand scope, timeline and cost before committing. We have an internal deadline this quarter.`,
        status: status as Prisma.LeadCreateManyInput["status"],
        source,
        serviceId: serviceBySlug.get(slug)?.id,
        ownerId: index % 3 === 0 ? admin : index % 3 === 1 ? pm : superAdmin,
        createdAt: daysAgo(index * 3 + 1),
      })),
      skipDuplicates: true,
    });
    console.log("  ✓ 10 additional leads");
  }

  // ---- Lead notes ----------------------------------------------------------
  const notedLeads = await prisma.lead.findMany({ take: 6, orderBy: { createdAt: "desc" }, select: { id: true } });
  if ((await prisma.leadNote.count()) === 0) {
    await prisma.leadNote.createMany({
      data: notedLeads.flatMap((lead, index) => [
        {
          leadId: lead.id,
          authorId: index % 2 === 0 ? admin : pm,
          body: "Called and left a voicemail. Sending a short capability summary by email.",
          createdAt: daysAgo(index + 1),
        },
        {
          leadId: lead.id,
          authorId: admin,
          body: "Discovery call booked. They want a fixed-scope proposal before the end of the month.",
          createdAt: daysAgo(index),
        },
      ]),
    });
    console.log("  ✓ lead notes");
  }

  // ---- Extra clients -------------------------------------------------------
  const clientCount = await prisma.clientProfile.count();
  if (clientCount < 6) {
    const bcrypt = (await import("bcryptjs")).default;
    const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe#2026", 12);
    const extra = [
      ["Aurora Collective", "Sadia Karim", "client@aurora.example"],
      ["Meridian Advisory", "Rakib Hasan", "client@meridian.example"],
      ["Trailpoint Logistics", "Tanvir Alam", "client@trailpoint.example"],
    ] as const;

    for (const [company, name, email] of extra) {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name,
          role: "CLIENT",
          passwordHash,
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
        },
        select: { id: true },
      });
      await prisma.clientProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          companyName: company,
          billingEmail: email,
          addressLine1: "Level 4, Gulshan Avenue",
          city: "Dhaka",
          country: "Bangladesh",
          taxId: `BIN-${Math.floor(Math.random() * 900000 + 100000)}`,
          onboardedAt: new Date(),
          referralCode: `HY-${company.slice(0, 3).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`,
        },
      });
    }
    console.log("  ✓ 3 additional clients");
  }

  const clients = await prisma.clientProfile.findMany({
    select: { id: true, companyName: true, user: { select: { id: true } } },
  });

  // ---- Service requests, proposals and orders ------------------------------
  if ((await prisma.serviceRequest.count()) === 0) {
    for (const [index, client] of clients.slice(0, 4).entries()) {
      const service = services[index % services.length];
      const request = await prisma.serviceRequest.create({
        data: {
          reference: ref("REQ", index + 1),
          clientId: client.id,
          serviceId: service.id,
          title: `${service.title} — phase ${index + 1}`,
          brief:
            "We would like to extend the current engagement. Please prepare a scope and timeline for the next phase, including the reporting cadence.",
          budget: ["100k–200k", "200k–400k", "400k+", "Not sure yet"][index],
          status: (["SUBMITTED", "IN_REVIEW", "OFFER_SENT", "ACCEPTED"] as const)[index],
          createdAt: daysAgo(index * 6 + 2),
        },
        select: { id: true },
      });

      await prisma.proposal.create({
        data: {
          requestId: request.id,
          title: `Proposal — ${service.title}`,
          body: "Fixed scope across three milestones with a two-week discovery, build increments and a launch window.",
          amount: 240000 + index * 60000,
          validUntil: new Date(Date.now() + 21 * 864e5),
          accepted: index === 3,
        },
      });
    }

    for (const [index, client] of clients.slice(0, 3).entries()) {
      const service = services[(index + 2) % services.length];
      await prisma.order.create({
        data: {
          reference: ref("ORD", index + 1),
          clientId: client.id,
          status: (["ACTIVE", "PENDING", "COMPLETED"] as const)[index],
          total: 320000 + index * 80000,
          notes: "Agreed from the accepted proposal.",
          createdAt: daysAgo(index * 9 + 4),
          items: {
            create: [
              { serviceId: service.id, title: `${service.title} — milestone 1`, quantity: 1, unitPrice: 180000 },
              { serviceId: service.id, title: "Discovery & architecture", quantity: 1, unitPrice: 140000 + index * 80000 },
            ],
          },
        },
      });
    }
    console.log("  ✓ service requests, proposals and orders");
  }

  // ---- Projects for the newer clients --------------------------------------
  const projectCount = await prisma.project.count();
  if (projectCount < 6) {
    for (const [index, client] of clients.slice(3).entries()) {
      const service = services[(index + 4) % services.length];
      const project = await prisma.project.create({
        data: {
          reference: ref("PRJ", index + 10),
          clientId: client.id,
          serviceId: service.id,
          name: `${client.companyName} — ${service.title}`,
          slug: `${(client.companyName ?? "client").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${service.slug}-${index}`,
          summary: `Delivery of ${service.title.toLowerCase()} for ${client.companyName}.`,
          status: (["IN_PROGRESS", "PLANNING", "REVIEW"] as const)[index % 3],
          progress: [45, 12, 78][index % 3],
          startDate: daysAgo(60 - index * 10),
          dueDate: new Date(Date.now() + (20 + index * 15) * 864e5),
          budget: 280000 + index * 70000,
          members: {
            create: [
              { userId: pm, roleLabel: "Project Manager" },
              { userId: admin, roleLabel: "Engineering" },
            ],
          },
          milestones: {
            create: [
              { title: "Discovery & architecture", status: "COMPLETED", position: 0, dueDate: daysAgo(40) },
              { title: "Design system", status: index === 1 ? "PENDING" : "COMPLETED", position: 1, dueDate: daysAgo(20) },
              { title: "Build", status: "IN_PROGRESS", position: 2, dueDate: new Date(Date.now() + 14 * 864e5) },
              { title: "Launch", status: "PENDING", position: 3, dueDate: new Date(Date.now() + 30 * 864e5) },
            ],
          },
        },
        select: { id: true },
      });

      await prisma.task.createMany({
        data: [
          { projectId: project.id, title: "Component library setup", status: "DONE", priority: "HIGH", assigneeId: admin },
          { projectId: project.id, title: "Homepage template", status: "IN_PROGRESS", priority: "HIGH", assigneeId: pm, dueDate: new Date(Date.now() + 5 * 864e5) },
          { projectId: project.id, title: "Analytics & consent wiring", status: "TODO", priority: "MEDIUM", assigneeId: admin, dueDate: new Date(Date.now() + 9 * 864e5) },
          { projectId: project.id, title: "Accessibility audit", status: "TODO", priority: "MEDIUM", dueDate: new Date(Date.now() + 16 * 864e5) },
          { projectId: project.id, title: "Content migration", status: "REVIEW", priority: "LOW", assigneeId: pm },
        ],
      });

      await prisma.projectFile.createMany({
        data: [
          { projectId: project.id, name: "Kickoff notes.pdf", url: "https://example.com/kickoff.pdf", mimeType: "application/pdf", sizeBytes: 184320 },
          { projectId: project.id, name: "Sitemap v2.pdf", url: "https://example.com/sitemap.pdf", mimeType: "application/pdf", sizeBytes: 96000 },
        ],
      });

      await prisma.projectActivity.createMany({
        data: [
          { projectId: project.id, actorId: pm, action: "project.created", detail: "Project created and kickoff scheduled.", createdAt: daysAgo(30) },
          { projectId: project.id, actorId: admin, action: "milestone.completed", detail: "Discovery & architecture signed off.", createdAt: daysAgo(20) },
          { projectId: project.id, actorId: pm, action: "note", detail: "Client asked to bring the launch date forward by a week.", createdAt: daysAgo(4) },
        ],
      });
    }
    console.log("  ✓ additional projects, tasks, files and activity");
  }

  // ---- Finance: invoices, payments, transactions, refunds ------------------
  const accounts = await prisma.account.findMany({ select: { id: true, type: true } });
  const bank = accounts.find((a) => a.type === "BANK")?.id ?? accounts[0]?.id;
  const wallet = accounts.find((a) => a.type === "MOBILE_WALLET")?.id ?? bank;

  if ((await prisma.invoice.count()) < 8) {
    // One historical refund, placed on the first settled payment we create.
    let refundDone = (await prisma.refund.count()) > 0;

    for (const [index, client] of clients.entries()) {
      const status = (["PAID", "ISSUED", "OVERDUE", "PARTIALLY_PAID", "PAID", "ISSUED"] as const)[index % 6];
      const subtotal = 140000 + index * 45000;
      const tax = Math.round(subtotal * 0.15);
      const total = subtotal + tax;
      const paid = status === "PAID" ? total : status === "PARTIALLY_PAID" ? Math.round(total / 2) : 0;

      const invoice = await prisma.invoice.create({
        data: {
          number: ref("INV", index + 20),
          clientId: client.id,
          status,
          issueDate: daysAgo(index * 7 + 6),
          issuedAt: daysAgo(index * 7 + 6),
          dueDate: status === "OVERDUE" ? daysAgo(4) : new Date(Date.now() + 12 * 864e5),
          paidAt: status === "PAID" ? daysAgo(index * 5 + 1) : null,
          subtotal,
          tax,
          total,
          amountPaid: paid,
          notes: "Milestone billing per the signed statement of work.",
          items: {
            create: [
              { description: "Delivery milestone", quantity: 1, unitPrice: subtotal, taxRate: 15, total },
            ],
          },
        },
        select: { id: true, number: true },
      });

      if (paid > 0) {
        const method = (["BKASH", "BANK_TRANSFER", "NAGAD"] as const)[index % 3];
        const payment = await prisma.payment.create({
          data: {
            reference: ref("PAY", index + 20),
            invoiceId: invoice.id,
            method,
            amount: paid,
            trxId: `TRX${Date.now().toString(36).toUpperCase()}${index}`,
            status: "VERIFIED",
            submittedById: client.user.id,
            verifiedById: finance,
            verifiedAt: daysAgo(index * 5),
            createdAt: daysAgo(index * 5 + 1),
          },
          select: { id: true },
        });

        await prisma.transaction.create({
          data: {
            reference: ref("TXN", index + 20),
            accountId: method === "BANK_TRANSFER" ? bank : wallet,
            type: "INCOME",
            amount: paid,
            description: `Payment for invoice ${invoice.number}`,
            relatedType: "Payment",
            relatedId: payment.id,
            occurredAt: daysAgo(index * 5),
          },
        });

        if (!refundDone) {
          refundDone = true;
          await prisma.refund.create({
            data: {
              reference: ref("REF", index + 1),
              paymentId: payment.id,
              invoiceId: invoice.id,
              amount: Math.round(paid * 0.25),
              reason: "Scope reduced by agreement — milestone 2 not started.",
              createdById: finance,
              createdAt: daysAgo(index * 4),
            },
          });
          await prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
          await prisma.transaction.create({
            data: {
              reference: ref("TXN", 90),
              type: "REFUND",
              amount: Math.round(paid * 0.25),
              description: "Refund against an agreed scope reduction",
              relatedType: "Payment",
              relatedId: payment.id,
              occurredAt: daysAgo(index * 4),
            },
          });
        }
      }

      // A pending submission so the verification queue has work in it.
      if (index === 1) {
        await prisma.payment.create({
          data: {
            reference: ref("PAY", 99),
            invoiceId: invoice.id,
            method: "NAGAD",
            amount: Math.round(total / 2),
            trxId: `TRXPENDING${index}${Date.now().toString(36)}`,
            status: "PENDING_VERIFICATION",
            submittedById: client.user.id,
            senderNumber: "01700-112233",
            createdAt: daysAgo(1),
          },
        });
      }
    }
    console.log("  ✓ invoices, payments, transactions and a refund");
  }

  if ((await prisma.expense.count()) < 6) {
    await prisma.expense.createMany({
      data: [
        { reference: ref("EXP", 10), category: "Software", vendor: "Vercel", description: "Hosting — monthly", amount: 2400, status: "APPROVED", createdById: admin, approvedById: finance, approvedAt: daysAgo(10), spentAt: daysAgo(10) },
        { reference: ref("EXP", 11), category: "Software", vendor: "Neon", description: "Database — monthly", amount: 1900, status: "APPROVED", createdById: admin, approvedById: finance, approvedAt: daysAgo(10), spentAt: daysAgo(10) },
        { reference: ref("EXP", 12), category: "Advertising", vendor: "Google Ads", description: "Brand campaign", amount: 42000, status: "SUBMITTED", createdById: admin, spentAt: daysAgo(3) },
        { reference: ref("EXP", 13), category: "Contractors", vendor: "Freelance illustrator", description: "Case study artwork", amount: 18000, status: "SUBMITTED", createdById: pm, spentAt: daysAgo(2) },
        { reference: ref("EXP", 14), category: "Office", vendor: "WeWork", description: "Desk rental", amount: 26000, status: "APPROVED", createdById: admin, approvedById: finance, approvedAt: daysAgo(25), spentAt: daysAgo(25) },
      ],
      skipDuplicates: true,
    });
    console.log("  ✓ expenses");
  }

  // ---- Conversations and tickets ------------------------------------------
  if ((await prisma.conversation.count()) < 5) {
    for (const [index, client] of clients.slice(0, 5).entries()) {
      const conversation = await prisma.conversation.create({
        data: {
          subject: `${client.companyName} — delivery updates`,
          clientUserId: client.user.id,
          lastMessageAt: daysAgo(index),
          participants: { create: [{ userId: client.user.id }, { userId: pm }] },
        },
        select: { id: true },
      });
      await prisma.message.createMany({
        data: [
          { conversationId: conversation.id, senderId: pm, body: "This week's demo is ready on staging. Anything you would like covered first?", createdAt: daysAgo(index + 2) },
          { conversationId: conversation.id, senderId: client.user.id, body: "Please start with the checkout flow — that is what the board will ask about.", createdAt: daysAgo(index + 1) },
          { conversationId: conversation.id, senderId: pm, body: "Noted. Internal check on load times before we show it.", isInternalNote: true, createdAt: daysAgo(index) },
        ],
      });
    }
    console.log("  ✓ conversations");
  }

  if ((await prisma.supportTicket.count()) < 6) {
    const subjects = [
      ["Add a second admin user", "ACCOUNT", "RESOLVED", "LOW"],
      ["Invoice tax line query", "BILLING", "OPEN", "MEDIUM"],
      ["Staging site is slow this morning", "TECHNICAL", "PENDING", "HIGH"],
      ["Request: monthly report as Excel", "GENERAL", "OPEN", "LOW"],
      ["Password reset email not arriving", "ACCOUNT", "OPEN", "URGENT"],
    ] as const;

    for (const [index, [subject, category, status, priority]] of subjects.entries()) {
      const client = clients[index % clients.length];
      const ticket = await prisma.supportTicket.create({
        data: {
          reference: ref("TKT", index + 10),
          clientId: client.id,
          subject,
          category,
          status: status as Prisma.SupportTicketCreateInput["status"],
          priority: priority as Prisma.SupportTicketCreateInput["priority"],
          assigneeId: index % 2 === 0 ? support : null,
          createdAt: daysAgo(index * 2 + 1),
        },
        select: { id: true },
      });
      await prisma.ticketMessage.createMany({
        data: [
          { ticketId: ticket.id, authorId: client.user.id, body: `${subject}. Could you take a look when you get a moment?`, createdAt: daysAgo(index * 2 + 1) },
          ...(index % 2 === 0
            ? [{ ticketId: ticket.id, authorId: support, body: "Looking into this now — I will come back to you today.", createdAt: daysAgo(index * 2) }]
            : []),
        ],
      });
    }
    console.log("  ✓ support tickets");
  }

  // ---- Client documents ----------------------------------------------------
  if ((await prisma.clientDocument.count()) === 0) {
    await prisma.clientDocument.createMany({
      data: clients.slice(0, 4).flatMap((client) => [
        { clientId: client.id, title: "Master services agreement.pdf", category: "CONTRACT", url: "https://example.com/msa.pdf" },
        { clientId: client.id, title: "Statement of work — phase 1.pdf", category: "PROPOSAL", url: "https://example.com/sow.pdf" },
      ]),
    });
    console.log("  ✓ client documents");
  }

  // ---- Media library -------------------------------------------------------
  if ((await prisma.mediaAsset.count()) === 0) {
    const folder = await prisma.mediaFolder.create({ data: { name: "Brand" }, select: { id: true } });
    await prisma.mediaAsset.createMany({
      data: [
        { folderId: folder.id, uploadedById: superAdmin, name: "logo-icon.svg", url: "/brand/logo-icon.svg", mimeType: "image/svg+xml", sizeBytes: 1758, altText: "HYASCKA mark" },
        { folderId: folder.id, uploadedById: superAdmin, name: "og-image.png", url: "/og-image.png", mimeType: "image/png", sizeBytes: 84000, width: 1200, height: 630, altText: "HYASCKA social share image" },
        { uploadedById: superAdmin, name: "logo-lockup.svg", url: "/brand/logo-lockup.svg", mimeType: "image/svg+xml", sizeBytes: 1732, altText: "HYASCKA horizontal lockup" },
      ],
    });
    console.log("  ✓ media library");
  }

  // ---- Notifications for every staff member -------------------------------
  const notificationCount = await prisma.notification.count();
  if (notificationCount < 8) {
    await prisma.notification.createMany({
      data: staffIds.flatMap((userId, index) => [
        {
          userId,
          type: "LEAD_CREATED" as const,
          title: "New enquiry — Stratus Cloud",
          body: "Arif Chowdhury asked about paid media. Budget 400k+.",
          href: "/dashboard/leads",
          read: false,
          createdAt: daysAgo(index % 3),
        },
        {
          userId,
          type: "PAYMENT_RECEIVED" as const,
          title: "Payment awaiting verification",
          body: "A Nagad payment is waiting for the finance team.",
          href: "/dashboard/finance/payments",
          read: index % 2 === 0,
          createdAt: daysAgo((index % 4) + 1),
        },
        {
          userId,
          type: "SYSTEM_ALERT" as const,
          title: "Weekly report is ready",
          body: "Your delivery report for last week can be exported from Finance → Reports.",
          href: "/dashboard/finance/reports",
          read: true,
          createdAt: daysAgo(6),
        },
      ]),
    });
    console.log("  ✓ notifications for every staff account");
  }

  // ---- Audit trail ---------------------------------------------------------
  if ((await prisma.auditLog.count()) < 8) {
    await prisma.auditLog.createMany({
      data: [
        { actorId: finance, actorRole: "FINANCE", action: "payment.verify", entityType: "Payment", summary: "Payment PAY-0020 verified for invoice INV-0020", createdAt: daysAgo(2) },
        { actorId: admin, actorRole: "ADMIN", action: "content.published", entityType: "BlogPost", summary: 'Article "Core Web Vitals" published', createdAt: daysAgo(4) },
        { actorId: superAdmin, actorRole: "SUPER_ADMIN", action: "settings.update", entityType: "SiteSetting", entityId: "theme", summary: "Theme policy updated", createdAt: daysAgo(5) },
        { actorId: pm, actorRole: "PROJECT_MANAGER", action: "project.status_changed", entityType: "Project", summary: "Aurora Collective project moved to In progress", createdAt: daysAgo(6) },
        { actorId: finance, actorRole: "FINANCE", action: "invoice.issued", entityType: "Invoice", summary: "Invoice INV-0022 issued", createdAt: daysAgo(7) },
      ],
    });
    await prisma.securityEvent.createMany({
      data: [
        { email: "unknown@example.com", type: "LOGIN_FAILED", detail: "unknown account", ipAddress: "203.0.113.10", createdAt: daysAgo(1) },
        { userId: admin, email: "admin.demo@hyascka.com", type: "LOGIN_SUCCESS", ipAddress: "203.0.113.22", createdAt: daysAgo(1) },
        { email: "bot@example.com", type: "RATE_LIMITED", detail: "contact form", ipAddress: "198.51.100.7", createdAt: daysAgo(3) },
      ],
    });
    console.log("  ✓ audit and security history");
  }

  // ---- Newsletter subscribers ---------------------------------------------
  if ((await prisma.subscriber.count()) === 0) {
    await prisma.subscriber.createMany({
      data: Array.from({ length: 8 }, (_, index) => ({
        email: `subscriber${index + 1}@example.com`,
        source: index % 2 === 0 ? "footer" : "blog",
        confirmed: index % 3 !== 0,
        createdAt: daysAgo(index * 4),
      })),
      skipDuplicates: true,
    });
  }
}
