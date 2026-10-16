import React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface text-text shadow-sm transition-all duration-200",
        hover && "hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 border-b border-border/80 px-6 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "font-display text-lg font-semibold leading-none tracking-tight text-text",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn("text-xs md:text-sm text-muted", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export const CardBody = CardContent;

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center border-t border-border/80 px-6 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
