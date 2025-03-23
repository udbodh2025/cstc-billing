import Papa from 'papaparse';
import { ContentType, ContentItem } from '@/types';

// Export content items to CSV
export const exportToCSV = (items: ContentItem[], contentType: ContentType): string => {
  // Prepare data for CSV
  const data = items.map(item => {
    const row: Record<string, any> = {};
    contentType.fields.forEach(field => {
      const value = item[field.name];
      // Handle null or undefined values
      if (value === null || value === undefined) {
        row[field.name] = '';
        return;
      }
      
      // Format values based on field type
      switch (field.type) {
        case 'date':
        case 'datetime':
          row[field.name] = value ? new Date(value).toISOString().split('T')[field.type === 'date' ? 0 : 1] : '';
          break;
        case 'boolean':
          row[field.name] = value ? '1' : '0';
          break;
        case 'number':
          row[field.name] = typeof value === 'number' ? value.toString() : '';
          break;
        default:
          row[field.name] = typeof value === 'string' ? value : String(value);
      }
    });
    return row;
  });

  // Convert to CSV with proper configuration
  return Papa.unparse(data, {
    quotes: true,
    header: true,
    skipEmptyLines: 'greedy',
    newline: '\n',
    encoding: 'utf-8'
  });
};

// Import content items from CSV
export const importFromCSV = async (file: File, contentType: ContentType): Promise<Partial<ContentItem>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      encoding: 'utf-8',
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
      complete: (results) => {
        try {
          if (!results.data || !Array.isArray(results.data)) {
            throw new Error('Invalid CSV format: No data found');
          }

          const errors: string[] = [];
          if (results.errors && results.errors.length > 0) {
            errors.push(...results.errors.map(e => `Parse error: ${e.message} at row ${e.row || 'unknown'}`))
          }

          const items = results.data.map((row: any, index: number) => {
            const item: Record<string, any> = {};
            const rowNumber = index + 2; // Add 2 to account for 0-based index and header row

            contentType.fields.forEach(field => {
              const value = row[field.name];
              if (value === undefined || value === '') {
                item[field.name] = null;
                return;
              }

              try {
                switch (field.type) {
                  case 'date':
                  case 'datetime':
                    const dateStr = field.type === 'date' ? `${value}T00:00:00Z` : value;
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) {
                      errors.push(`Row ${rowNumber}: Invalid ${field.type} format for field '${field.name}': ${value}`);
                      item[field.name] = null;
                    } else {
                      item[field.name] = date.toISOString();
                    }
                    break;
                  case 'boolean':
                    const boolStr = value.toString().toLowerCase().trim();
                    if (!['true', 'false', '0', '1', 'yes', 'no'].includes(boolStr)) {
                      errors.push(`Row ${rowNumber}: Invalid boolean value for field '${field.name}': ${value}`);
                      item[field.name] = null;
                    } else {
                      item[field.name] = ['true', '1', 'yes'].includes(boolStr);
                    }
                    break;
                  case 'number':
                    const num = Number(value);
                    if (isNaN(num)) {
                      errors.push(`Row ${rowNumber}: Invalid number format for field '${field.name}': ${value}`);
                      item[field.name] = null;
                    } else {
                      item[field.name] = num;
                    }
                    break;
                  default:
                    item[field.name] = String(value);
                }
              } catch (error) {
                errors.push(`Row ${rowNumber}: ${error.message}`);
                item[field.name] = null;
              }
            });

            return item;
          });

          if (errors.length > 0) {
            reject(new Error(`CSV parsing errors:\n${errors.join('\n')}`))
          } else {
            resolve(items);
          }
        } catch (error) {
          reject(new Error(`Failed to parse CSV data: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
};