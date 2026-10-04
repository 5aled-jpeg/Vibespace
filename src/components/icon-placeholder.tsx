import * as React from "react";
import * as LucideIcons from "lucide-react";

export interface IconPlaceholderProps extends React.SVGProps<SVGSVGElement> {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
  className?: string;
  [key: string]: any;
}

export function IconPlaceholder({
  lucide,
  className,
  ...props
}: IconPlaceholderProps) {
  if (!lucide) return null;

  // Clean icon name
  const iconName = lucide.replace(/Icon$/, "");
  const IconComponent =
    (LucideIcons as any)[iconName] ||
    (LucideIcons as any)[lucide] ||
    LucideIcons.File;

  return <IconComponent className={className} {...props} />;
}

export default IconPlaceholder;
