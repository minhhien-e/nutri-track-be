import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class DateKeyPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('dateKey must use YYYY-MM-DD format');
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('dateKey must be a valid calendar date');
    }

    return value;
  }
}
