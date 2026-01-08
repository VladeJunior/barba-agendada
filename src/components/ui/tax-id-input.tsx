import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export interface TaxIdInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  showValidation?: boolean;
}

// Format as CPF (XXX.XXX.XXX-XX) or CNPJ (XX.XXX.XXX/XXXX-XX)
export function formatTaxId(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 11) {
    // CPF format
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // CNPJ format
    return digits
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
}

export function validateTaxId(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 || digits.length === 14;
}

export function getTaxIdType(value: string): "cpf" | "cnpj" | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return "cpf";
  if (digits.length === 14) return "cnpj";
  return null;
}

const TaxIdInput = React.forwardRef<HTMLInputElement, TaxIdInputProps>(
  ({ className, value, onChange, showValidation = true, ...props }, ref) => {
    const [touched, setTouched] = React.useState(false);
    const isValid = validateTaxId(value);
    const taxIdType = getTaxIdType(value);
    const digits = value.replace(/\D/g, "");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const formatted = formatTaxId(rawValue);
      onChange(formatted);
    };

    const handleBlur = () => {
      setTouched(true);
    };

    const showStatus = showValidation && touched && digits.length > 0;

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="000.000.000-00"
          maxLength={18}
          className={cn(
            showStatus && isValid && "border-green-500 focus-visible:ring-green-500",
            showStatus && !isValid && "border-destructive focus-visible:ring-destructive",
            "pr-10",
            className
          )}
          {...props}
        />
        {showStatus && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
        {digits.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {taxIdType === "cpf" && "CPF válido"}
            {taxIdType === "cnpj" && "CNPJ válido"}
            {!taxIdType && digits.length < 11 && `Faltam ${11 - digits.length} dígitos para CPF`}
            {!taxIdType && digits.length > 11 && digits.length < 14 && `Faltam ${14 - digits.length} dígitos para CNPJ`}
          </p>
        )}
      </div>
    );
  }
);

TaxIdInput.displayName = "TaxIdInput";

export { TaxIdInput };
