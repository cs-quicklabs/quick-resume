"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormWrapper } from "@/components/form-wrapper";

interface SheetOption {
  value: string;
  label: string;
}

export default function DashboardPage() {
  const [sheets, setSheets] = useState<SheetOption[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

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
        setSheets(data.sheets || []);
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
        // Store resume data in sessionStorage
        sessionStorage.setItem("resumeData", JSON.stringify(data.resume));
        // Navigate to preview page
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
    <FormWrapper>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick Resume</CardTitle>
          <CardDescription>Select a Google Sheet to generate a resume</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="sheet-select">Google Sheet</FieldLabel>
                <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                  <SelectTrigger id="sheet-select">
                    <SelectValue placeholder={fetching ? "Loading sheets..." : "Select a sheet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {fetching ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : sheets.length === 0 ? (
                      <SelectItem value="no-sheets" disabled>
                        No sheets available
                      </SelectItem>
                    ) : (
                      sheets.map((sheet) => (
                        <SelectItem key={sheet.value} value={sheet.value}>
                          {sheet.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </Field>
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              <Field orientation="horizontal">
                <Button type="submit" disabled={loading || !selectedSheet}>
                  {loading ? "Generating..." : "Generate Resume"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </FormWrapper>
  );
}

