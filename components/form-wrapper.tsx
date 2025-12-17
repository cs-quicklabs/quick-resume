import { cn } from "@/lib/utils"

function FormWrapper({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="bg-background w-full">
      <div
        data-slot="form-wrapper"
        className={cn(
          "mx-auto grid min-h-screen w-full max-w-5xl min-w-0 content-center items-start gap-8 p-4 pt-2 sm:gap-12 sm:p-6 md:grid-cols-2 md:gap-8 lg:p-12 2xl:max-w-6xl",
          className
        )}
        {...props}
      />
    </div>
  )
}

export { FormWrapper }
