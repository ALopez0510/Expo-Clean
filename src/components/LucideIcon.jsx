import React from 'react';
import {
  ChevronDown,
  Check,
  X,
  Printer,
  Download,
  FileText,
  FileCheck,
  Award
} from 'lucide-react';

const iconMap = { ChevronDown, Check, X, Printer, Download, FileText, FileCheck, Award };

export function LucideIcon({ name, size = 16, className = '', color, ...props }) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} color={color} aria-hidden="true" {...props} />;
}
