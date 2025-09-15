"use client";

import { FC, useId } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectHolderProps {
  label: string;
  placeholder: string;
  values: string[];
  defaultValue?: string;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  onValueChange: (value: any) => void,
  className?: string
}

const SelectHolder: FC<SelectHolderProps> = ({
  label,
  placeholder,
  values,
  defaultValue,
  onValueChange,
  className
}) => {
  const id = useId();

  return (
    <div className={cn("group relative", className)}>
      <label
        htmlFor={id}
        className="bg-background text-teal-500 absolute start-1 top-0 z-10 block -translate-y-1/2 px-2 text-xs group-has-disabled:opacity-50 uppercase"
      >
        {label}
      </label>
      <Select defaultValue={defaultValue ?? values[0]} onValueChange={onValueChange}>
        <SelectTrigger
          id={id}
          className="bg-background dark:bg-background dark:hover:bg-background min-w-32"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {values.map((val: string, index: number) => {
            return (
              <SelectItem key={index} value={val}>
                <span className="capitalize">{val}</span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectHolder;
