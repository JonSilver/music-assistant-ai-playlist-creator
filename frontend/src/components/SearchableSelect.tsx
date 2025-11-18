import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions
} from "@headlessui/react";
import React, { useState } from "react";

interface Option {
    value: string;
    label: string;
}

interface ISearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchableSelect: React.FC<ISearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Type to search..."
}) => {
    const [query, setQuery] = useState("");

    const filteredOptions =
        query === ""
            ? options
            : options.filter(
                  option =>
                      option.label.toLowerCase().includes(query.toLowerCase()) ||
                      option.value.toLowerCase().includes(query.toLowerCase())
              );

    return (
        <Combobox
            value={value}
            onChange={(val: string | null) => {
                if (val !== null) {
                    onChange(val);
                }
            }}
            onClose={() => {
                setQuery("");
            }}
        >
            <div className="relative">
                <div className="relative">
                    <ComboboxInput
                        className="select select-bordered select-sm w-full pr-10"
                        displayValue={(val: string) => {
                            const opt = options.find(o => o.value === val);
                            return opt?.label ?? val;
                        }}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            setQuery(event.target.value);
                        }}
                        placeholder={placeholder}
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg
                            className="h-5 w-5 text-base-content/50"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </ComboboxButton>
                </div>
                <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-base-100 shadow-lg border border-base-300">
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-base-content/50">
                            No matches found
                        </div>
                    ) : (
                        filteredOptions.map(option => (
                            <ComboboxOption
                                key={option.value}
                                value={option.value}
                                className="cursor-pointer select-none px-4 py-2 hover:bg-primary hover:text-primary-content data-[focus]:bg-primary data-[focus]:text-primary-content"
                            >
                                {option.label}
                            </ComboboxOption>
                        ))
                    )}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
};
