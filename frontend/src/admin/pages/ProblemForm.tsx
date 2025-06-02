import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { GripVertical, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Zod schema
const TestCaseSchema = z.object({
  input: z.string().min(1),
  expectedOutput: z.string().min(1),
});

const ProblemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  exampleInput: z.string().optional(),
  exampleOutput: z.string().optional(),
  testCases: z.array(TestCaseSchema).min(1),
});

type ProblemFormValues = z.infer<typeof ProblemSchema>;

export default function ProblemForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProblemFormValues>({
    resolver: zodResolver(ProblemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'EASY',
      testCases: [{ input: '', expectedOutput: ''}],
    },
  });

  const { fields, append, remove, move } = useFieldArray({ name: 'testCases', control });

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor));

  const prefix = window.location.hostname.startsWith('admin.') ? '' : '/admin';

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/problems/${id}`).then((res) => {
        if (res.data.IsSucceeded) {
          const data = res.data.Data;
          reset({
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            exampleInput: data.exampleInput,
            exampleOutput: data.exampleOutput,
            testCases: data.testCases.map((tc: any) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
            })),
          });
        }
      });
    }
  }, [id]);

  async function onSubmit(values: ProblemFormValues) {
    try {
      if (isEdit) {
        await api.put(`/admin/problems/${id}`, values);
      } else {
        await api.post('/admin/problems', values);
      }
      navigate(`${prefix}/problems`);
    } catch (e) {
      alert('Kaydetme başarısız');
    }
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    move(oldIndex, newIndex);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{isEdit ? 'Problemi Düzenle' : 'Yeni Problem'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-medium">Başlık</label>
          <input {...register('title')} className="input" />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block font-medium">Açıklama (Markdown)</label>
          <textarea {...register('description')} rows={8} className="textarea" />
          {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        </div>
        <div>
          <label className="block font-medium mb-1">Zorluk</label>
          <div className="flex gap-2">
            {(['EASY','MEDIUM','HARD'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setValue('difficulty', opt)}
                className={
                  `px-3 py-1 rounded-full text-sm font-medium border transition-colors `+
                  (watch('difficulty') === opt
                    ? {
                        EASY: 'bg-green-600 text-white border-green-600',
                        MEDIUM: 'bg-yellow-500 text-white border-yellow-500',
                        HARD: 'bg-red-600 text-white border-red-600',
                      }[opt]
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-zinc-600')
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Example IO */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Örnek Girdi</label>
            <textarea {...register('exampleInput')} rows={3} className="textarea" />
          </div>
          <div>
            <label className="block font-medium">Örnek Çıktı</label>
            <textarea {...register('exampleOutput')} rows={3} className="textarea" />
          </div>
        </div>

        {/* Test cases */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Test Case'ler</h2>
          {errors.testCases && <p className="text-sm text-red-500 mb-2">En az bir test case eklemelisiniz.</p>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map((field, idx) => (
                <div key={field.id} className="border p-3 mb-3 rounded bg-gray-50 dark:bg-zinc-700 relative flex gap-3">
                  <GripVertical className="cursor-grab mt-1" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="block text-sm font-medium">Girdi</label>
                      <textarea {...register(`testCases.${idx}.input` as const)} rows={2} className="textarea" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Beklenen Çıktı</label>
                      <textarea {...register(`testCases.${idx}.expectedOutput` as const)} rows={2} className="textarea" />
                    </div>
                  </div>
                  <button type="button" className="btn-icon text-red-500 absolute top-2 right-2" onClick={() => remove(idx)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </SortableContext>
            <DragOverlay />
          </DndContext>
          <button type="button" className="btn btn-secondary" onClick={() => append({ input: '', expectedOutput: ''})}>+ Test Case Ekle</button>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={() => navigate(`${prefix}/problems`)}>İptal</button>
          <button type="submit" className="btn btn-primary">Kaydet</button>
        </div>
      </form>
    </div>
  );
} 