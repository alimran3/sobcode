import { useEffect, useState } from 'react';
import api from '../../utils/api';
import GlassCard from '../../components/ui/GlassCard';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { getBMICategory } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  HiOutlineHeart, HiOutlinePlusCircle, HiOutlineX,
  HiOutlineTrash, HiOutlineScale, HiOutlineClipboardList,
  HiOutlineCalendar, HiOutlineExclamationCircle,
} from 'react-icons/hi';

const VITAL_TYPES = [
  { key: 'bloodPressure', label: 'Blood Pressure', icon: '🩸', color: 'from-red-500 to-pink-500', unit: 'mmHg' },
  { key: 'heartRate', label: 'Heart Rate', icon: '❤️', color: 'from-rose-500 to-red-500', unit: 'BPM' },
  { key: 'bloodSugar', label: 'Blood Sugar', icon: '🧪', color: 'from-amber-500 to-orange-500', unit: 'mg/dL' },
  { key: 'bloodOxygen', label: 'SpO2', icon: '🫁', color: 'from-blue-500 to-cyan-500', unit: '%' },
  { key: 'temperature', label: 'Temperature', icon: '🌡️', color: 'from-purple-500 to-violet-500', unit: '°' },
  { key: 'weight', label: 'Weight', icon: '⚖️', color: 'from-emerald-500 to-teal-500', unit: 'kg' },
];

export default function HealthVitals() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({});
  const [vitals, setVitals] = useState([]);
  const [recentSymptoms, setRecentSymptoms] = useState([]);
  const [activeType, setActiveType] = useState('bloodPressure');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    systolic: '', diastolic: '', bpm: '', context: 'Resting',
    sugarType: 'Fasting', sugarValue: '', spo2: '',
    temperatureValue: '', temperatureUnit: 'F',
    weight: '', notes: '',
  });

  const [symptomForm, setSymptomForm] = useState({
    symptomName: '', severity: 'Mild', duration: '', notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, vitalsRes] = await Promise.all([
        api.get('/health/summary'),
        api.get('/health/vitals', { params: { type: activeType, limit: 50 } }),
      ]);
      setSummary(summaryRes.data.data.summary);
      setRecentSymptoms(summaryRes.data.data.recentSymptoms || []);
      setVitals(vitalsRes.data.data.vitals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeType]);

  const handleSubmit = async () => {
    const payload = { type: activeType, notes: form.notes };

    if (activeType === 'bloodPressure') {
      if (!form.systolic || !form.diastolic) return toast.error('Enter systolic and diastolic values.');
      payload.systolic = parseInt(form.systolic);
      payload.diastolic = parseInt(form.diastolic);
    } else if (activeType === 'heartRate') {
      if (!form.bpm) return toast.error('Enter BPM value.');
      payload.bpm = parseInt(form.bpm);
      payload.context = form.context;
    } else if (activeType === 'bloodSugar') {
      if (!form.sugarValue) return toast.error('Enter sugar value.');
      payload.sugarType = form.sugarType;
      payload.sugarValue = parseFloat(form.sugarValue);
    } else if (activeType === 'bloodOxygen') {
      if (!form.spo2) return toast.error('Enter SpO2 value.');
      payload.spo2 = parseInt(form.spo2);
    } else if (activeType === 'temperature') {
      if (!form.temperatureValue) return toast.error('Enter temperature.');
      payload.temperatureValue = parseFloat(form.temperatureValue);
      payload.temperatureUnit = form.temperatureUnit;
    } else if (activeType === 'weight') {
      if (!form.weight) return toast.error('Enter weight.');
      payload.weightValue = parseFloat(form.weight);
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/health/vitals', payload);
      toast.success('Vital recorded!');
      if (data.data.alerts?.length) {
        data.data.alerts.forEach((a) => toast(a, { icon: '⚠️', duration: 6000 }));
      }
      setShowAddModal(false);
      setForm({ systolic: '', diastolic: '', bpm: '', context: 'Resting', sugarType: 'Fasting', sugarValue: '', spo2: '', temperatureValue: '', temperatureUnit: 'F', weight: '', notes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log vital.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSymptomSubmit = async () => {
    if (!symptomForm.symptomName) return toast.error('Enter symptom name.');
    setSubmitting(true);
    try {
      await api.post('/health/vitals', {
        type: 'symptom',
        symptomName: symptomForm.symptomName,
        symptomSeverity: symptomForm.severity,
        notes: `Duration: ${symptomForm.duration}`.trim(),
      });
      toast.success('Symptom logged!');
      setShowSymptomModal(false);
      setSymptomForm({ symptomName: '', severity: 'Mild', duration: '', notes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log symptom.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/health/vitals/${id}`);
      toast.success('Record deleted.');
      fetchData();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const bmiCategory = getBMICategory(user?.bmi);

  const formatReading = (v) => {
    if (!v) return '—';
    switch (v.type) {
      case 'bloodPressure': return `${v.systolic}/${v.diastolic}`;
      case 'heartRate': return `${v.bpm} ${v.context ? `(${v.context})` : ''}`;
      case 'bloodSugar': return `${v.sugarValue} (${v.sugarType})`;
      case 'bloodOxygen': return `${v.spo2}%`;
      case 'temperature': return `${v.temperatureValue}°${v.temperatureUnit}`;
      case 'weight': return `${v.weightValue} kg`;
      default: return '—';
    }
  };

  const formatReadingFull = (v) => {
    if (!v) return '—';
    switch (v.type) {
      case 'bloodPressure': return `${v.systolic}/${v.diastolic} mmHg`;
      case 'heartRate': return `${v.bpm} BPM`;
      case 'bloodSugar': return `${v.sugarValue} mg/dL (${v.sugarType})`;
      case 'bloodOxygen': return `${v.spo2}%`;
      case 'temperature': return `${v.temperatureValue}°${v.temperatureUnit}`;
      case 'weight': return `${v.weightValue} kg`;
      default: return v.symptomName || '—';
    }
  };

  const vitalCount = Object.values(summary).filter(Boolean).length;
  const last7 = vitals.filter(v => new Date(v.recordedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Health Vitals</h1>
          <p className="text-sm text-surface-500 mt-0.5">Track and monitor your health readings.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSymptomModal(true)} className="btn-secondary text-sm">
            <HiOutlineClipboardList className="w-4 h-4" /> Log Symptom
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
            <HiOutlinePlusCircle className="w-4 h-4" /> Log Reading
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <GlassCard className="p-4">
          <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider">Types Tracked</p>
          <p className="text-2xl font-display font-extrabold mt-1">{vitalCount}/6</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider">Total Readings</p>
          <p className="text-2xl font-display font-extrabold mt-1">{vitals.length}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider">This Week</p>
          <p className="text-2xl font-display font-extrabold mt-1">{last7.length}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider">Symptoms</p>
          <p className="text-2xl font-display font-extrabold mt-1">{recentSymptoms.length}</p>
        </GlassCard>
      </div>

      {/* BMI & User Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Body Mass Index</p>
              <p className="text-3xl font-display font-extrabold mt-1">{user?.bmi || '—'}</p>
              {user?.bmi ? (
                <p className={`text-sm font-semibold mt-0.5 ${bmiCategory.color}`}>{bmiCategory.label}</p>
              ) : (
                <p className="text-sm text-surface-400 mt-0.5">Log your height & weight in profile.</p>
              )}
            </div>
            <div className="text-right text-sm text-surface-500 space-y-1">
              <p><span className="text-surface-400">Height:</span> <span className="font-semibold text-surface-700 dark:text-surface-200">{user?.height || '—'} cm</span></p>
              <p><span className="text-surface-400">Weight:</span> <span className="font-semibold text-surface-700 dark:text-surface-200">{user?.weight || '—'} kg</span></p>
              <p><span className="text-surface-400">Blood:</span> <span className="font-semibold text-red-500">{user?.bloodGroup || '—'}</span></p>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 opacity-[0.04]" />
        </GlassCard>

        {/* Symptoms Summary */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineClipboardList className="w-5 h-5 text-brand-500" />
            <h3 className="font-display font-bold text-sm">Recent Symptoms</h3>
          </div>
          {recentSymptoms.length === 0 ? (
            <p className="text-sm text-surface-400 py-4 text-center">No symptoms logged.</p>
          ) : (
            <div className="space-y-2">
              {recentSymptoms.slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.symptomName}</span>
                  <span className={`badge text-[10px] ${
                    s.symptomSeverity === 'Severe' ? 'badge-danger' :
                    s.symptomSeverity === 'Moderate' ? 'badge-warning' : 'badge-info'
                  }`}>{s.symptomSeverity || 'Mild'}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Vital Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        {VITAL_TYPES.map((vt) => (
          <button key={vt.key} onClick={() => setActiveType(vt.key)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${activeType === vt.key
                ? `bg-gradient-to-r ${vt.color} text-white shadow-lg`
                : 'glass text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}>
            <span>{vt.icon}</span> {vt.label}
          </button>
        ))}
      </div>

      {/* Latest reading */}
      {summary[activeType] && (
        <GlassCard className="mb-4 border-l-4 border-brand-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Latest Reading</p>
              <p className="text-2xl font-display font-extrabold">{formatReadingFull(summary[activeType])}</p>
              <p className="text-xs text-surface-500 mt-1">
                <HiOutlineCalendar className="w-3.5 h-3.5 inline mr-1" />
                {new Date(summary[activeType].recordedAt).toLocaleString()}
              </p>
            </div>
            <div className="text-5xl opacity-20">{VITAL_TYPES.find(v => v.key === activeType)?.icon}</div>
          </div>
        </GlassCard>
      )}

      {/* History */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">History</h2>
          {vitals.length > 0 && (
            <span className="text-xs text-surface-400">{vitals.length} records</span>
          )}
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : vitals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">{VITAL_TYPES.find(v => v.key === activeType)?.icon}</p>
            <p className="font-display font-bold text-surface-700 dark:text-surface-300">No readings yet</p>
            <p className="text-sm text-surface-500 mt-1 mb-4">Start tracking your {VITAL_TYPES.find(v => v.key === activeType)?.label.toLowerCase()}.</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm inline-flex">
              <HiOutlinePlusCircle className="w-4 h-4" /> Log Reading
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {vitals.map((v) => (
              <div key={v._id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">{VITAL_TYPES.find(t => t.key === v.type)?.icon || '📊'}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{formatReading(v)}</p>
                    <div className="flex items-center gap-2 text-xs text-surface-400">
                      <span>{new Date(v.recordedAt).toLocaleDateString()}</span>
                      <span>{new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {v.notes && (
                    <span className="text-xs text-surface-400 hidden sm:block max-w-[120px] truncate">{v.notes}</span>
                  )}
                  <button onClick={() => handleDelete(v._id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition-all">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Add Reading Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)}
        title={`Log ${VITAL_TYPES.find((v) => v.key === activeType)?.label || 'Reading'}`}>
        <div className="space-y-4">
          {activeType === 'bloodPressure' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Systolic (mmHg) *</label>
                <input type="number" value={form.systolic} onChange={(e) => setForm({ ...form, systolic: e.target.value })} placeholder="120" className="input-field" /></div>
              <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Diastolic (mmHg) *</label>
                <input type="number" value={form.diastolic} onChange={(e) => setForm({ ...form, diastolic: e.target.value })} placeholder="80" className="input-field" /></div>
            </div>
          )}
          {activeType === 'heartRate' && (
            <>
              <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">BPM *</label>
                <input type="number" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: e.target.value })} placeholder="72" className="input-field" /></div>
              <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Context</label>
                <select value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} className="input-field">
                  <option>Resting</option><option>Active</option><option>Post-Exercise</option></select></div>
            </>
          )}
          {activeType === 'bloodSugar' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Type</label>
                <select value={form.sugarType} onChange={(e) => setForm({ ...form, sugarType: e.target.value })} className="input-field">
                  <option>Fasting</option><option>After Meal</option><option>Random</option><option>HbA1c</option></select></div>
              <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Value (mg/dL) *</label>
                <input type="number" value={form.sugarValue} onChange={(e) => setForm({ ...form, sugarValue: e.target.value })} placeholder="100" className="input-field" /></div>
            </div>
          )}
          {activeType === 'bloodOxygen' && (
            <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">SpO2 (%) *</label>
              <input type="number" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} placeholder="98" className="input-field" /></div>
          )}
          {activeType === 'temperature' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Temperature *</label>
                <input type="number" step="0.1" value={form.temperatureValue} onChange={(e) => setForm({ ...form, temperatureValue: e.target.value })} placeholder="98.6" className="input-field" /></div>
              <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Unit</label>
                <select value={form.temperatureUnit} onChange={(e) => setForm({ ...form, temperatureUnit: e.target.value })} className="input-field">
                  <option value="F">°F</option><option value="C">°C</option></select></div>
            </div>
          )}
          {activeType === 'weight' && (
            <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Weight (kg) *</label>
              <input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="70" className="input-field" /></div>
          )}
          <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Notes</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." className="input-field" /></div>

          <button onClick={handleSubmit} disabled={submitting} className="btn-emerald w-full mt-2">
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...
              </span>
            ) : 'Save Reading'}
          </button>
        </div>
      </Modal>

      {/* Log Symptom Modal */}
      <Modal open={showSymptomModal} onClose={() => setShowSymptomModal(false)} title="Log Symptom">
        <div className="space-y-4">
          <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Symptom *</label>
            <input value={symptomForm.symptomName} onChange={(e) => setSymptomForm({ ...symptomForm, symptomName: e.target.value })}
              placeholder="e.g., Headache, Nausea..." className="input-field" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Severity</label>
              <select value={symptomForm.severity} onChange={(e) => setSymptomForm({ ...symptomForm, severity: e.target.value })} className="input-field">
                <option>Mild</option><option>Moderate</option><option>Severe</option></select></div>
            <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Duration</label>
              <input value={symptomForm.duration} onChange={(e) => setSymptomForm({ ...symptomForm, duration: e.target.value })}
                placeholder="e.g., 2 days" className="input-field" /></div>
          </div>
          <div><label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1">Notes</label>
            <textarea value={symptomForm.notes} onChange={(e) => setSymptomForm({ ...symptomForm, notes: e.target.value })}
              placeholder="Additional details..." rows={2} className="input-field resize-none" /></div>

          <button onClick={handleSymptomSubmit} disabled={submitting} className="btn-emerald w-full mt-2">
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...
              </span>
            ) : 'Log Symptom'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
