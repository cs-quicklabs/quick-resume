"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SheetOption {
  value: string;
  label: string;
}

const ignoredSheetNames = new Set<string>([
  "__TEMPLATE__",
  "Metadata"
])

export default function DashboardPage() {
  const [sheets, setSheets] = useState<SheetOption[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    setFetching(true);
    setError("");
    try {
      const response = await fetch("/api/sheets");
      if (response.ok) {
        const data = await response.json();
        console.log('data', data)
        const cleanSheetList = data.sheets.filter((item: SheetOption) => !ignoredSheetNames.has(item.label))
        setSheets(cleanSheetList || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to fetch sheets");
      }
    } catch {
      setError("An error occurred while fetching sheets");
    } finally {
      setFetching(false);
    }
  };

  const handleCommandSelect = (currentValue: string) => {
    const selected = sheets.find(
      (s) => s.label.toLowerCase() === currentValue.toLowerCase()
    );
    if (selected) {
      setSelectedSheet(selected.value === selectedSheet ? "" : selected.value);
      setOpen(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSheet) {
      setError("Please select a sheet");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [spreadsheetId, sheetName] = selectedSheet.split("|");

      if (!spreadsheetId || !sheetName) {
        setError("Invalid sheet selection");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spreadsheetId,
          sheetName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem("resumeData", JSON.stringify(data.resume));
        window.location.href = "/preview";
      } else {
        const data = await response.json();
        setError(data.error || "Failed to generate resume");
      }
    } catch {
      setError("An error occurred while generating the resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo Section */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">Q</span>
        </div>
        <span className="text-xl font-semibold text-foreground">Quick Resume</span>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-semibold text-center">
            Generate your resume
          </CardTitle>
          <CardDescription className="text-center">
            Select a Candidate Sheet Name to generate your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate}>
            <FieldGroup className="space-y-6">
              <Field>
                <FieldLabel htmlFor="sheet-select" className="text-sm font-medium mb-2">
                  Candidate Sheet Name<span className="text-destructive">*</span>
                </FieldLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between h-10 bg-background"
                      disabled={fetching}
                    >
                      <span className="truncate">
                        {selectedSheet
                          ? sheets.find((sheet) => sheet.value === selectedSheet)?.label
                          : fetching
                            ? "Loading sheets..."
                            : "Select a sheet..."}
                      </span>
                      <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search sheet..." />
                      <CommandList>
                        <CommandEmpty>No sheet found.</CommandEmpty>
                        <CommandGroup>
                          {fetching ? (
                            <CommandItem value="loading" disabled>
                              Loading...
                            </CommandItem>
                          ) : (
                            sheets.map((sheet) => {
                              const isSelected = selectedSheet === sheet.value;
                              return (
                                <CommandItem
                                  key={sheet.value}
                                  value={sheet.label}
                                  onSelect={handleCommandSelect}
                                >
                                  {sheet.label}
                                  <IconCheck
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              );
                            })
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Field>
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading || !selectedSheet}
                className="w-full h-10 text-base font-medium"
              >
                {loading ? "Generating..." : "Generate Resume"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

