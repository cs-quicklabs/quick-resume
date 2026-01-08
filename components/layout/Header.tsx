"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
  userInitials?: string;
}

export function Header({ title = "Quick Resume", actions, userInitials }: HeaderProps) {
  return (
    <nav 
      className="text-white px-6 flex items-center justify-between"
      style={{ 
        height: "50px",
        backgroundColor: "rgb(53, 53, 53)"
      }}
    >
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        {actions}
        {userInitials && (
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold text-sm">
            {userInitials.toUpperCase().slice(0, 2)}
          </div>
        )}
      </div>
    </nav>
  );
}

