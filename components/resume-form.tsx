"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { FormWrapper } from "./form-wrapper"

export function ResumeForm() {
  return (
    <FormWrapper>
      <FormComponent />
    </FormWrapper>
  )
}

const sheetData = [
  "Sheet 1",
  "Sheet 2",
  "Sheet 3",
  "Sheet 4",
] as const

function FormComponent() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Quick Resume</CardTitle>
        <CardDescription>Please select candidate sheet and template</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="small-form-role">Candidate Name</FieldLabel>
              <Combobox items={sheetData}>
                <ComboboxInput
                  id="small-form-framework"
                  placeholder="Select a framework"
                  required
                />
                <ComboboxContent>
                  <ComboboxEmpty>No Candidate found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
            <Field orientation="horizontal">
              <Button type="submit">Submit</Button>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
