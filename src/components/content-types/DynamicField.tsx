import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, X, Upload, FileUp, FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface DynamicFieldProps {
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'datetime' | 'select' | 'file' | 'image' | 'csv';
  value: any;
  onChange: (value: any) => void;
  options?: string[];
  placeholder?: string;
  isReadOnly?: boolean;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({
  type,
  value,
  onChange,
  options = [],
  placeholder,
  isReadOnly = false
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'image' && !file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (type === 'csv' && file.type !== 'text/csv') {
        toast.error('Please select a CSV file');
        return;
      }
      onChange(file);
    }
  };

  const handleExportCSV = () => {
    if (!value) return;
    const blob = new Blob([value], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (type === 'file' || type === 'image' || type === 'csv') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById(`file-${type}`).click()}
            disabled={isReadOnly}
          >
            {type === 'image' ? <Upload className="mr-2 h-4 w-4" /> : 
             type === 'csv' ? <FileUp className="mr-2 h-4 w-4" /> :
             <FileUp className="mr-2 h-4 w-4" />}
            {value ? (type === 'image' ? 'Change Image' : 'Change File') : `Upload ${type.toUpperCase()}`}
          </Button>
          {type === 'csv' && value && (
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCSV}
              className="px-3"
            >
              <FileDown className="h-4 w-4" />
            </Button>
          )}
        </div>
        <input
          id={`file-${type}`}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={type === 'image' ? 'image/*' : type === 'csv' ? '.csv' : '*'}
          disabled={isReadOnly}
        />
        {type === 'image' && value && (
          <div className="mt-2 max-h-[300px] overflow-y-auto">
            <img
              src={typeof value === 'string' ? value : URL.createObjectURL(value)}
              alt="Preview"
              className="max-w-xs rounded-md"
            />
          </div>
        )}
      </div>
    );
  }

  switch (type) {
    case 'number':
      return (
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? null : isNaN(Number(val)) ? null : Number(val));
          }}
          placeholder={placeholder}
          min="0"
        />
      );

    case 'boolean':
      if (isReadOnly) {
        return (
          <div className="flex items-center justify-center">
            {value ? 
              <Check className="h-5 w-5 text-green-500" /> : 
              <X className="h-5 w-5 text-red-500" />
            }
          </div>
        );
      }
      return (
        <Checkbox
          checked={value || false}
          onCheckedChange={onChange}
        />
      );

    case 'datetime':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !value && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), 'PPP p') : <span>Pick a date and time</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => {
                if (date) {
                  const now = new Date();
                  date.setHours(now.getHours());
                  date.setMinutes(now.getMinutes());
                }
                onChange(date);
              }}
              initialFocus
            />
            {value && (
              <div className="p-3 border-t">
                <Input
                  type="time"
                  value={value ? format(new Date(value), 'HH:mm') : ''}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const date = new Date(value);
                    date.setHours(parseInt(hours));
                    date.setMinutes(parseInt(minutes));
                    onChange(date);
                  }}
                />
              </div>
            )}
          </PopoverContent>
        </Popover>
      );

    case 'select':
      return (
        <Select
          value={value || ''}
          onValueChange={onChange}
          disabled={isReadOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={isReadOnly}
        />
      );

    case 'text':
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={isReadOnly}
        />
      );

    case 'date':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !value && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={onChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );

    case 'select':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder || 'Select an option'} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px]"
        />
      );

    default:
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      );
  }
};