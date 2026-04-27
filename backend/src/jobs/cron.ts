import cron from 'node-cron';
import nodemailer from 'nodemailer';
import prisma from '../config/prisma';
import { env } from '../config/env';

export const startCronJobs = async () => {
  let transporter: nodemailer.Transporter;

  if (env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to ethereal test account
    const account = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    console.log('[CRON] Using ethereal test account for emails.');
  }

  // Run automatically every day at 9:00 AM server time.
  cron.schedule('0 9 * * *', async () => {
    try {
      const lendings = await prisma.lending.findMany({ 
        where: {
          alertSent: false,
          borrowerEmail: { not: null },
          status: 'APPROVED'
        },
        include: { item: true }
      });
      
      const today = new Date(); 
      today.setHours(0, 0, 0, 0);
      
      for (const l of lendings) {
        const retDate = new Date(l.lentOn + 'T00:00:00');
        retDate.setDate(retDate.getDate() + l.duration);
        
        if (retDate < today) {
          // It's overdue! Send email.
          const info = await transporter.sendMail({
            from: '"Robotics Club Inventory" <inventory@roboticsclub.com>',
            to: l.borrowerEmail as string,
            subject: `🚨 OVERDUE: ${l.item.name} Equipment Return`,
            text: `Hi ${l.theirMember},\n\nThe ${l.qty}x ${l.item.name} you borrowed for ${l.club} was due on ${retDate.toDateString()}.\n\nPlease return it to the lab immediately as other members may be waiting to use it.\n\nThank you,\nRobotics & Software Club`
          });
          
          console.log(`[CRON] Overdue Email Sent for Item ${l.itemId} to ${l.borrowerEmail}`);
          if (!env.SMTP_HOST) {
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
          }
          
          await prisma.lending.update({
            where: { id: l.id },
            data: { alertSent: true }
          });
        }
      }
    } catch (e) {
      console.error("[CRON] Overdue Alert Error:", e);
    }
  });

  console.log('[CRON] Cron jobs initialized.');
};
