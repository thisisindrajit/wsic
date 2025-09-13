"use client";

import Link from "next/link";
import { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface CategoryCardProps {
  category: Doc<"categories">;
  className?: string;
}

export default function CategoryCard({ category, className }: CategoryCardProps) {
  const { theme, systemTheme } = useTheme();
  
  // Determine the current theme (handle system theme)
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';
  
  // Select appropriate color based on theme
  const hexColor = isDark 
    ? (category.darkHex || "#9CA3AF") 
    : (category.lightHex || "#6B7280");

  // Convert hex to RGB for glassmorphism effect
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 107, g: 114, b: 128 }; // fallback to gray
  };

  const rgb = hexToRgb(hexColor);

  // Theme-appropriate styling with better visibility
  const borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isDark ? 0.6 : 0.4})`;
  
  // Background colors optimized for current theme
  const glassBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isDark ? 0.15 : 0.1})`;
  const iconBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
  const hoverBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;

  return (
    <Link
      href={`/user/explore/category/${category.slug}`}
      className={cn(
        "group block relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${glassBg}, ${isDark ? "rgba(60, 60, 60, 0.08)" :"rgba(255, 255, 255, 0.08)"})`,
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Glassmorphism backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          background: `linear-gradient(135deg, ${glassBg}, ${isDark ? glassBg : "rgba(255, 255, 255, 0.04)"}))`,
        }}
      />

      {/* Content */}
      <div className="relative p-6 h-full flex flex-col gap-3">
        {/* Icon and color indicator */}
        <div className="flex items-center justify-between">
          <div
            className="text-3xl p-3 rounded-lg"
            style={{
              backgroundColor: iconBg,
            }}
          >
            {category.icon}
          </div>
        </div>

        {/* Category name */}
        <div
          className="text-xl font-semibold group-hover:text-opacity-90 transition-colors"
          style={{ color: hexColor }}
        >
          {category.name}
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed">
          {category.description}
        </p>

        {/* Hover effect overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${hoverBg}, transparent)`,
          }}
        />
      </div>
    </Link>
  );
}