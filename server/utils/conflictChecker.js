import Bill from '../models/Bill.js';
import HealthVital from '../models/HealthVital.js';

/**
 * Checks for drug conflicts based on patient profile.
 * Returns array of warning objects.
 */
export const checkConflicts = async (patient, medicine) => {
  const warnings = [];

  if (!patient || !medicine) return warnings;

  // CHECK 1: ALLERGY CHECK
  if (patient.allergies && patient.allergies.length > 0 && medicine.contraindications?.allergyTriggers) {
    for (const allergy of patient.allergies) {
      const allergyName = allergy.name.toLowerCase();
      for (const trigger of medicine.contraindications.allergyTriggers) {
        if (trigger.toLowerCase().includes(allergyName) || allergyName.includes(trigger.toLowerCase())) {
          warnings.push({
            type: 'allergy',
            severity: 'red',
            message: `DANGER — Patient is allergic to ${allergy.name}. ${medicine.brandName} contains ${trigger}. DO NOT SELL.`,
          });
        }
      }
    }
  }

  // CHECK 2: DRUG-DRUG INTERACTION CHECK
  if (patient.currentMedicines && patient.currentMedicines.length > 0 && medicine.contraindications?.conflictingDrugs) {
    for (const currentMed of patient.currentMedicines) {
      const currentGeneric = (currentMed.genericName || currentMed.brandName || '').toLowerCase();
      const currentBrand = (currentMed.brandName || '').toLowerCase();
      for (const conflictDrug of medicine.contraindications.conflictingDrugs) {
        const conflictLower = conflictDrug.toLowerCase();
        if (currentGeneric.includes(conflictLower) || currentBrand.includes(conflictLower) || conflictLower.includes(currentGeneric)) {
          warnings.push({
            type: 'drugDrug',
            severity: 'red',
            message: `WARNING — ${medicine.brandName} may interact with ${currentMed.brandName || currentGeneric} (${conflictDrug}).`,
          });
        }
      }
    }
  }

  // CHECK 3: CONDITION CONFLICT CHECK
  if (patient.medicalConditions && patient.medicalConditions.length > 0 && medicine.contraindications?.conflictingConditions) {
    for (const condition of patient.medicalConditions) {
      if (condition.status !== 'Active') continue;
      const condName = condition.name.toLowerCase();
      for (const conflictCond of medicine.contraindications.conflictingConditions) {
        if (condName.includes(conflictCond.toLowerCase()) || conflictCond.toLowerCase().includes(condName)) {
          warnings.push({
            type: 'condition',
            severity: 'yellow',
            message: `CAUTION — Patient has ${condition.name}. ${medicine.brandName} may be contraindicated for this condition.`,
          });
        }
      }
    }
  }

  // CHECK 4: AGE RESTRICTION CHECK
  if (patient.dateOfBirth && medicine.ageRestriction) {
    const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    if (medicine.ageRestriction.minAge && age < medicine.ageRestriction.minAge) {
      warnings.push({
        type: 'age',
        severity: 'yellow',
        message: `Not recommended for patients under ${medicine.ageRestriction.minAge}. Patient age: ${age}.${medicine.ageRestriction.note ? ' ' + medicine.ageRestriction.note : ''}`,
      });
    }
    if (medicine.ageRestriction.maxAge && age > medicine.ageRestriction.maxAge) {
      warnings.push({
        type: 'age',
        severity: 'yellow',
        message: `Not recommended for patients over ${medicine.ageRestriction.maxAge}. Patient age: ${age}.`,
      });
    }
  }

  // CHECK 5: PREGNANCY CHECK
  if (patient.pregnancyStatus === 'Pregnant' || patient.pregnancyStatus === 'Breastfeeding') {
    if (medicine.contraindications?.conflictingConditions) {
      const pregConflict = medicine.contraindications.conflictingConditions.some((c) =>
        c.toLowerCase().includes('pregnan') || c.toLowerCase().includes('breastfeed')
      );
      if (pregConflict) {
        warnings.push({
          type: 'pregnancy',
          severity: 'red',
          message: `DANGER — Contraindicated during ${patient.pregnancyStatus.toLowerCase()}. DO NOT SELL without doctor approval.`,
        });
      }
    }
  }

  // CHECK 6: BLOOD GROUP COMPATIBILITY
  if (patient.bloodGroup && medicine.contraindications?.bloodGroupRestrictions) {
    const restrictions = medicine.contraindications.bloodGroupRestrictions;
    if (restrictions.incompatible && restrictions.incompatible.includes(patient.bloodGroup)) {
      warnings.push({
        type: 'bloodGroup',
        severity: 'red',
        message: `DANGER — Blood group ${patient.bloodGroup} should not take ${medicine.brandName} without medical supervision.`,
      });
    }
  }

  // CHECK 7: VITAL-BASED CONFLICTS (Heart Rate, Blood Pressure, Blood Sugar, etc.)
  const recentVitals = await getRecentVitals(patient._id);
  
  if (medicine.contraindications?.vitalThresholds && recentVitals) {
    const { vitalThresholds } = medicine.contraindications;
    
    // Blood Pressure conflict
    if (vitalThresholds.bloodPressure && recentVitals.bloodPressure) {
      const bp = recentVitals.bloodPressure;
      const bpConf = vitalThresholds.bloodPressure;
      
      if (bpConf.maxSystolic && bp.systolic > bpConf.maxSystolic) {
        warnings.push({
          type: 'vital',
          severity: 'red',
          message: `DANGER — Patient's blood pressure (${bp.systolic}/${bp.diastolic} mmHg) exceeds safe limit (${bpConf.maxSystolic}/${bpConf.maxDiastolic || bpConf.maxSystolic} mmHg) for ${medicine.brandName}.`,
          vitalType: 'bloodPressure',
          vitalValue: `${bp.systolic}/${bp.diastolic}`,
          threshold: `${bpConf.maxSystolic}/${bpConf.maxDiastolic || bpConf.maxSystolic}`,
        });
      }
      if (bpConf.maxDiastolic && bp.diastolic > bpConf.maxDiastolic) {
        warnings.push({
          type: 'vital',
          severity: 'red',
          message: `DANGER — Patient's diastolic pressure (${bp.diastolic} mmHg) is high. ${medicine.brandName} may worsen this.`,
          vitalType: 'bloodPressure',
          vitalValue: `${bp.systolic}/${bp.diastolic}`,
          threshold: `${bpConf.maxSystolic}/${bpConf.maxDiastolic}`,
        });
      }
      if (bpConf.minSystolic && bp.systolic < bpConf.minSystolic) {
        warnings.push({
          type: 'vital',
          severity: 'yellow',
          message: `CAUTION — Patient's blood pressure (${bp.systolic}/${bp.diastolic} mmHg) is low. ${medicine.brandName} may lower it further.`,
          vitalType: 'bloodPressure',
          vitalValue: `${bp.systolic}/${bp.diastolic}`,
          threshold: `${bpConf.minSystolic}/${bpConf.minDiastolic || bpConf.minSystolic}`,
        });
      }
    }

    // Heart Rate conflict
    if (vitalThresholds.heartRate && recentVitals.heartRate) {
      const hr = recentVitals.heartRate;
      const hrConf = vitalThresholds.heartRate;
      
      if (hrConf.maxBpm && hr.bpm > hrConf.maxBpm) {
        warnings.push({
          type: 'vital',
          severity: 'red',
          message: `DANGER — Patient's heart rate (${hr.bpm} BPM) is elevated. ${medicine.brandName} may increase heart rate further.`,
          vitalType: 'heartRate',
          vitalValue: `${hr.bpm} BPM`,
          threshold: `max ${hrConf.maxBpm} BPM`,
        });
      }
      if (hrConf.minBpm && hr.bpm < hrConf.minBpm) {
        warnings.push({
          type: 'vital',
          severity: 'yellow',
          message: `CAUTION — Patient's heart rate (${hr.bpm} BPM) is low. ${medicine.brandName} may lower it further.`,
          vitalType: 'heartRate',
          vitalValue: `${hr.bpm} BPM`,
          threshold: `min ${hrConf.minBpm} BPM`,
        });
      }
    }

    // Blood Sugar conflict
    if (vitalThresholds.bloodSugar && recentVitals.bloodSugar) {
      const sugar = recentVitals.bloodSugar;
      const sugarConf = vitalThresholds.bloodSugar;
      
      if (sugarConf.maxSugar && sugar.sugarValue > sugarConf.maxSugar) {
        warnings.push({
          type: 'vital',
          severity: 'red',
          message: `DANGER — Patient's ${sugar.sugarType || ''} blood sugar (${sugar.sugarValue} mg/dL) is high. ${medicine.brandName} may affect blood sugar levels.`,
          vitalType: 'bloodSugar',
          vitalValue: `${sugar.sugarValue} mg/dL (${sugar.sugarType})`,
          threshold: `max ${sugarConf.maxSugar} mg/dL`,
        });
      }
      if (sugarConf.minSugar && sugar.sugarValue < sugarConf.minSugar) {
        warnings.push({
          type: 'vital',
          severity: 'yellow',
          message: `CAUTION — Patient's ${sugar.sugarType || ''} blood sugar (${sugar.sugarValue} mg/dL) is low. ${medicine.brandName} may lower it further.`,
          vitalType: 'bloodSugar',
          vitalValue: `${sugar.sugarValue} mg/dL (${sugar.sugarType})`,
          threshold: `min ${sugarConf.minSugar} mg/dL`,
        });
      }
    }

    // Blood Oxygen conflict
    if (vitalThresholds.bloodOxygen && recentVitals.bloodOxygen) {
      const spo2 = recentVitals.bloodOxygen;
      const spo2Conf = vitalThresholds.bloodOxygen;
      
      if (spo2Conf.minSpo2 && spo2.spo2 < spo2Conf.minSpo2) {
        warnings.push({
          type: 'vital',
          severity: 'red',
          message: `DANGER — Patient's blood oxygen (${spo2.spo2}%) is low. ${medicine.brandName} may worsen oxygen levels.`,
          vitalType: 'bloodOxygen',
          vitalValue: `${spo2.spo2}%`,
          threshold: `min ${spo2Conf.minSpo2}%`,
        });
      }
    }

    // Temperature conflict
    if (vitalThresholds.temperature && recentVitals.temperature) {
      const temp = recentVitals.temperature;
      const tempConf = vitalThresholds.temperature;
      
      if (tempConf.maxTemp && temp.temperatureValue > tempConf.maxTemp) {
        warnings.push({
          type: 'vital',
          severity: 'yellow',
          message: `CAUTION — Patient has fever (${temp.temperatureValue}°${temp.temperatureUnit}). Some medicines may not be suitable.`,
          vitalType: 'temperature',
          vitalValue: `${temp.temperatureValue}°${temp.temperatureUnit}`,
          threshold: `max ${tempConf.maxTemp}°${temp.temperatureUnit}`,
        });
      }
    }
  }

  // CHECK 8: DUPLICATE MEDICINE CHECK
  const recentPurchaseDate = new Date();
  recentPurchaseDate.setDate(recentPurchaseDate.getDate() - 7);

  const recentBills = await Bill.find({
    patient: patient._id,
    createdAt: { $gte: recentPurchaseDate },
    'items.medicine': medicine._id,
  });

  if (recentBills.length > 0) {
    const lastPurchase = recentBills[0];
    const daysAgo = Math.ceil((Date.now() - lastPurchase.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    warnings.push({
      type: 'duplicate',
      severity: 'yellow',
      message: `Patient purchased ${medicine.brandName} ${daysAgo} day(s) ago from another pharmacy. Possible duplicate.`,
    });
  }

  return warnings;
};

/**
 * Get the most recent vital readings for each type
 */
async function getRecentVitals(patientId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const vitalTypes = ['bloodPressure', 'heartRate', 'bloodSugar', 'bloodOxygen', 'temperature'];
  const vitals = {};

  for (const type of vitalTypes) {
    const latest = await HealthVital.findOne({
      patient: patientId,
      type,
      recordedAt: { $gte: thirtyDaysAgo },
    }).sort({ recordedAt: -1 });

    if (latest) {
      vitals[type] = latest;
    }
  }

  return Object.keys(vitals).length > 0 ? vitals : null;
}