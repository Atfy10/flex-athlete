import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DayPicker, DropdownProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CalendarDropdown({ value, onChange, children }: DropdownProps) {
  const options = React.Children.toArray(children) as React.ReactElement<
    React.HTMLProps<HTMLOptionElement>
  >[];

  const selected = options.find((opt) => opt.props.value === value);
  const label = selected?.props.children;

  return (
    <Select
      value={String(value)}
      onValueChange={(val) => {
        const syntheticEvent = {
          target: { value: val },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange?.(syntheticEvent);
      }}
    >
      <SelectTrigger
        className={cn(
          "h-7 gap-1 border border-border/60 bg-background px-2.5 py-0",
          "text-xs font-medium text-foreground shadow-none",
          "rounded-md hover:bg-accent hover:border-border",
          "focus:ring-1 focus:ring-ring focus:ring-offset-0",
          "transition-colors duration-150 [&>svg]:opacity-60",
          "min-w-0"
        )}
      >
        <SelectValue>{label}</SelectValue>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
      </SelectTrigger>
      <SelectContent
        className={cn(
          "max-h-52 overflow-y-auto",
          "rounded-lg border border-border/60 bg-popover",
          "shadow-[0_4px_20px_hsl(var(--foreground)/0.08)]",
          "p-1"
        )}
        position="popper"
        sideOffset={4}
      >
        {options.map((opt, idx) => (
          <SelectItem
            key={`${opt.props.value}-${idx}`}
            value={String(opt.props.value)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-normal",
              "cursor-pointer transition-colors duration-100",
              "focus:bg-accent focus:text-accent-foreground",
              "data-[state=checked]:font-medium data-[state=checked]:text-primary"
            )}
          >
            {opt.props.children}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        caption: "flex justify-center pt-0.5 relative items-center gap-1",
        caption_label: "text-sm font-medium hidden",
        caption_dropdowns: "flex gap-1.5 items-center",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 text-muted-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          "rounded-md transition-colors duration-150",
          "opacity-70 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-muted-foreground/70 rounded-md w-8 h-7 font-normal text-[0.7rem] flex items-center justify-center",
        row: "flex w-full mt-1",
        cell: cn(
          "relative h-8 w-8 p-0 text-center text-sm",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          "[&:has([aria-selected].day-outside)]:bg-accent/30",
          "[&:has([aria-selected])]:bg-accent/50",
          "first:[&:has([aria-selected])]:rounded-l-md",
          "last:[&:has([aria-selected])]:rounded-r-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal text-sm",
          "rounded-md transition-colors duration-100",
          "hover:bg-accent hover:text-accent-foreground",
          "aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground font-medium",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
          "shadow-sm"
        ),
        day_today: cn(
          "bg-accent/60 text-accent-foreground font-semibold",
          "ring-1 ring-primary/20"
        ),
        day_outside: cn(
          "day-outside text-muted-foreground/40",
          "aria-selected:bg-accent/30 aria-selected:text-muted-foreground"
        ),
        day_disabled: "text-muted-foreground/30 pointer-events-none",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Dropdown: CalendarDropdown,
        IconLeft: () => <ChevronLeft className="h-3.5 w-3.5" />,
        IconRight: () => <ChevronRight className="h-3.5 w-3.5" />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
