import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  showValidation?: boolean;
}

const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");
  
  // Limit to 11 digits (DDD + 9 digits)
  const limitedDigits = digits.slice(0, 11);
  
  // Format based on length
  if (limitedDigits.length <= 2) {
    return limitedDigits;
  } else if (limitedDigits.length <= 7) {
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
  } else if (limitedDigits.length <= 11) {
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
  }
  
  return limitedDigits;
};

const validatePhoneNumber = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  // Valid if has 10 digits (DDD + 8) or 11 digits (DDD + 9)
  return digits.length === 10 || digits.length === 11;
};

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, showValidation = true, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState(formatPhoneNumber(value));
    const [isValid, setIsValid] = React.useState<boolean | null>(null);
    const [isTouched, setIsTouched] = React.useState(false);

    React.useEffect(() => {
      setInputValue(formatPhoneNumber(value));
      if (value && isTouched) {
        setIsValid(validatePhoneNumber(value));
      }
    }, [value, isTouched]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setInputValue(formatted);
      
      // Extract only digits for validation and callback
      const digits = formatted.replace(/\D/g, "");
      
      if (onChange) {
        onChange(formatted);
      }

      // Validate if user has typed something
      if (digits.length > 0) {
        setIsTouched(true);
        setIsValid(validatePhoneNumber(formatted));
      } else {
        setIsValid(null);
        setIsTouched(false);
      }
    };

    const handleBlur = () => {
      if (inputValue) {
        setIsTouched(true);
        setIsValid(validatePhoneNumber(inputValue));
      }
    };

    return (
      <div className="relative">
        <Input
          type="text"
          className={cn(
            "pr-10",
            showValidation && isValid === true && "border-green-500 focus-visible:ring-green-500",
            showValidation && isValid === false && "border-destructive focus-visible:ring-destructive",
            className
          )}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="(00) 00000-0000"
          ref={ref}
          {...props}
        />
        {showValidation && isTouched && isValid !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-destructive" />
            )}
          </div>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput, validatePhoneNumber, formatPhoneNumber };
