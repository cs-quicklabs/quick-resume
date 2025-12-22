import { cn } from "@/lib/utils"

function FormWrapper({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="bg-background w-full min-h-screen flex items-center justify-center">
      <div
        data-slot="form-wrapper"
        className={cn(
          "w-full max-w-2xl px-4 sm:px-6 lg:px-8",
          className
        )}
        {...props}
      />
    </div>
  )
}

export { FormWrapper }
