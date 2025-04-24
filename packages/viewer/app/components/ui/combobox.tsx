"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

type Item<T> = [string, string, T]

type PropTypes<T> = {
  items: Readonly<Item<T>>[]
  placeholder?: string
  emptyText?: string
  onItemSelected?: (item: T) => void
}

export function Combobox<T>({ items, placeholder, emptyText, onItemSelected }: PropTypes<T>) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={items.length === 0}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {value
            ? items.find(([text, _]) => text === value)?.[0]
            : placeholder || "Select something..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>{ emptyText }</CommandEmpty>
            <CommandGroup>
              {items.map(([text, key, item]) => (
                <CommandItem
                  key={key}
                  value={text}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    if (onItemSelected && currentValue !== value) {
                      onItemSelected(item)
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === text ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {text}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
