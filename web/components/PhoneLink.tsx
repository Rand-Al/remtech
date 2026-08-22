import type { ReactNode } from "react";
import { getContacts } from "@/lib/contacts";
import { phoneHrefFromPhone } from "@/shared/settings";

export default async function PhoneLink({
  className,
  children,
  ariaLabel,
}: {
  className?: string;
  children?: ReactNode;
  ariaLabel?: string;
}) {
  const contacts = await getContacts();
  return (
    <a className={className} href={phoneHrefFromPhone(contacts.phone)} aria-label={ariaLabel}>
      {children ?? contacts.phone}
    </a>
  );
}
