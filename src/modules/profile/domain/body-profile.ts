import { Gender } from "@prisma/client";

export class BodyProfile {
  constructor(
    public readonly gender: Gender,
    public readonly age: number,
    public readonly heightCm: number,
    public readonly weightKg: number,
  ) {}

  public calculateBMR(): number {
    const genderOffset = this.gender === Gender.male ? 5 : -161;
    return 10 * this.weightKg + 6.25 * this.heightCm - 5 * this.age + genderOffset;
  }

  public calculateBMI(): number {
    const heightM = this.heightCm / 100;
    return this.weightKg / (heightM * heightM);
  }

  public calculateLeanBodyMass(): number {
    // Sử dụng công thức Boer Formula chuẩn
    if (this.gender === Gender.male) {
      return 0.407 * this.weightKg + 0.267 * this.heightCm - 19.2;
    } else {
      return 0.252 * this.weightKg + 0.473 * this.heightCm - 48.3;
    }
  }

  public calculateFatMass(): number {
    return Math.max(0, this.weightKg - this.calculateLeanBodyMass());
  }

  public calculateIdealWeight(): number {
    // Dựa trên chỉ số BMI lý tưởng là 22
    const heightM = this.heightCm / 100;
    return 22 * (heightM * heightM);
  }
}
