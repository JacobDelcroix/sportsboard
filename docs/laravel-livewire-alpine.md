# Laravel, Livewire, and Alpine.js integration

This guide starts from the recommended declarative custom-element API and shows three application patterns:

- a standard Laravel and Blade form;
- a Livewire 4 component with JSON and thumbnail upload;
- a reusable Alpine.js component for client-side state and asynchronous submission.

## Shared application setup

Install SportsBoard with npm:

```bash
npm install @jacobdelcroix/sportsboard
```

Register both custom elements once in the main Vite entry:

```js
// resources/js/app.js
import '@jacobdelcroix/sportsboard/element';
```

Load that entry from the application layout:

```blade
<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
</head>
<body>
    {{ $slot }}

    @livewireScripts
</body>
</html>
```

The page or component only needs the HTML element after this shared import.

## Laravel and Blade form

### Migration and model

Keep JSON as the source document and the thumbnail path as derived data:

```php
Schema::table('exercise_diagrams', function (Blueprint $table) {
    $table->json('document');
    $table->string('thumbnail_path')->nullable();
});
```

```php
final class ExerciseDiagram extends Model
{
    protected $fillable = [
        'sport',
        'document',
        'thumbnail_path',
    ];

    protected function casts(): array
    {
        return [
            'document' => 'array',
        ];
    }
}
```

### Blade form

The JSON is supplied through `data`. Blade escapes the attribute, and the browser restores its JSON value when SportsBoard reads it.

```blade
<form
    id="exercise-diagram-form"
    method="POST"
    action="{{ route('exercises.diagrams.update', [$exercise, $diagram]) }}"
>
    @csrf
    @method('PUT')

    <div class="h-[760px] w-full">
        <sports-board-editor
            id="exercise-board"
            name="diagram"
            sport="{{ $diagram->sport }}"
            locale="{{ app()->getLocale() === 'fr' ? 'fr' : 'en' }}"
            data="{{ json_encode($diagram->document) }}"
            class="h-full w-full"
        ></sports-board-editor>
    </div>

    <p id="diagram-error" role="alert" hidden></p>

    <button type="submit">Save exercise</button>
</form>
```

Because the element has `name="diagram"`, a normal form submission already contains its current JSON. No hidden input is required.

### Submit JSON and thumbnail with `fetch`

Add the page behavior to an application module or a Blade stack script:

```js
const form = document.querySelector('#exercise-diagram-form');
const editor = document.querySelector('#exercise-board');
const submitButton = form.querySelector('[type="submit"]');
const errorMessage = document.querySelector('#diagram-error');

async function submitDiagram() {
  submitButton.disabled = true;
  errorMessage.hidden = true;

  try {
    const thumbnail = await editor.toBlob({
      width: 640,
      type: 'image/webp',
      quality: 0.85
    });

    const body = new FormData(form);
    body.set('diagram', editor.toJSON());
    body.set('thumbnail', thumbnail, 'diagram.webp');

    const response = await fetch(form.action, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message ?? `Save failed (${response.status})`);
    }
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.hidden = false;
  } finally {
    submitButton.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  submitDiagram();
});

// Route SportsBoard's built-in Save button through the same form flow.
editor.addEventListener('save', () => form.requestSubmit());
```

The request remains `POST` because the Blade form includes `_method=PUT`. Do not set a multipart `Content-Type` manually; the browser supplies the correct boundary.

### Controller

```php
use IlluminateHttpJsonResponse;
use IlluminateHttpRequest;
use IlluminateSupportFacadesStorage;
use IlluminateValidationValidationException;

public function update(
    Request $request,
    Exercise $exercise,
    ExerciseDiagram $diagram,
): JsonResponse {
    abort_unless($diagram->exercise_id === $exercise->id, 404);

    $validated = $request->validate([
        'diagram' => ['required', 'json'],
        'thumbnail' => ['required', 'image', 'mimes:webp,png,jpeg', 'max:2048'],
    ]);

    $document = json_decode($validated['diagram'], true, flags: JSON_THROW_ON_ERROR);

    if (($document['schema'] ?? null) !== 'sportsboard'
        || ($document['version'] ?? null) !== 1
        || ! is_array($document['surface'] ?? null)
        || ! is_array($document['elements'] ?? null)) {
        throw ValidationException::withMessages([
            'diagram' => 'The diagram has an invalid SportsBoard structure.',
        ]);
    }

    $newThumbnail = $request->file('thumbnail')->store(
        "exercise-diagrams/{$exercise->id}",
        'public',
    );

    $previousThumbnail = $diagram->thumbnail_path;

    $diagram->update([
        'document' => $document,
        'thumbnail_path' => $newThumbnail,
    ]);

    if ($previousThumbnail) {
        Storage::disk('public')->delete($previousThumbnail);
    }

    return response()->json([
        'diagram' => $diagram->fresh(),
        'thumbnail_url' => Storage::disk('public')->url($newThumbnail),
    ]);
}
```

For production validation, also enforce the allowed surface and element types for the stored sport. The client-side registry validation improves the interface but does not replace server-side trust boundaries.

## Livewire 4 component

The recommended Livewire flow keeps frequent drag changes in the browser. JSON and thumbnail are synchronized only when the coach saves, avoiding a Livewire request for every movement.

### Component class

```php
namespace App\Livewire\Exercises;

use App\Models\ExerciseDiagram;
use Illuminate\Support\Facades\Storage;
use Livewire\Component;
use Livewire\WithFileUploads;

final class DiagramEditor extends Component
{
    use WithFileUploads;

    public ExerciseDiagram $diagramModel;
    public string $diagram = '';
    public $thumbnail = null;

    public function mount(ExerciseDiagram $diagram): void
    {
        $this->diagramModel = $diagram;
        $this->diagram = json_encode($diagram->document, JSON_THROW_ON_ERROR);
    }

    public function save(): void
    {
        $validated = $this->validate([
            'diagram' => ['required', 'json'],
            'thumbnail' => ['required', 'image', 'mimes:webp,png,jpeg', 'max:2048'],
        ]);

        $document = json_decode($validated['diagram'], true, flags: JSON_THROW_ON_ERROR);
        $newThumbnail = $this->thumbnail->store(
            "exercise-diagrams/{$this->diagramModel->exercise_id}",
            'public',
        );

        $previousThumbnail = $this->diagramModel->thumbnail_path;

        $this->diagramModel->update([
            'document' => $document,
            'thumbnail_path' => $newThumbnail,
        ]);

        if ($previousThumbnail) {
            Storage::disk('public')->delete($previousThumbnail);
        }

        $this->thumbnail = null;
        $this->dispatch('diagram-saved');
    }

    public function render()
    {
        return view('livewire.exercises.diagram-editor');
    }
}
```

### Livewire Blade view

Use `wire:ignore` only around the editor. Livewire can continue updating the status and buttons outside that region.

```blade
<div>
    <div wire:ignore class="h-[760px] w-full">
        <sports-board-editor
            data-sports-board
            sport="{{ $diagramModel->sport }}"
            locale="{{ app()->getLocale() === 'fr' ? 'fr' : 'en' }}"
            data="{{ $diagram }}"
            class="h-full w-full"
        ></sports-board-editor>
    </div>

    <div class="mt-4 flex items-center gap-3">
        <button type="button" wire:click="$js.saveDiagram" data-save-diagram>
            Save diagram
        </button>

        <span data-upload-progress></span>
    </div>

    @error('diagram') <p role="alert">{{ $message }}</p> @enderror
    @error('thumbnail') <p role="alert">{{ $message }}</p> @enderror

    @script
    <script>
        const editor = $wire.$el.querySelector('[data-sports-board]');
        const saveButton = $wire.$el.querySelector('[data-save-diagram]');
        const progress = $wire.$el.querySelector('[data-upload-progress]');
        let saving = false;

        const uploadThumbnail = (file) => new Promise((resolve, reject) => {
            $wire.upload(
                'thumbnail',
                file,
                resolve,
                () => reject(new Error('Thumbnail upload failed.')),
                (event) => {
                    progress.textContent = `${event.detail.progress}%`;
                }
            );
        });

        $wire.$js.saveDiagram = async () => {
            if (saving) return;

            saving = true;
            saveButton.disabled = true;
            progress.textContent = 'Preparing thumbnail…';

            try {
                const blob = await editor.toBlob({
                    width: 640,
                    type: 'image/webp',
                    quality: 0.85,
                });

                const file = new File([blob], 'diagram.webp', {
                    type: blob.type,
                });

                // Keep drag operations local; synchronize only at save time.
                $wire.diagram = editor.toJSON();

                await uploadThumbnail(file);
                await $wire.save();

                progress.textContent = 'Saved';
            } catch (error) {
                progress.textContent = error.message;
            } finally {
                saving = false;
                saveButton.disabled = false;
            }
        };

        editor.addEventListener('save', () => {
            $wire.$js.saveDiagram();
        });
    </script>
    @endscript
</div>
```

Class-based Livewire components require the `@script` wrapper. Livewire binds `$wire` to the component and cleans up component-scoped scripts when the component is removed.

Avoid `$wire.$set('diagram', event.detail.json)` inside every `change` event. Dragging an element can produce many changes; synchronizing once during Save is substantially cheaper.

## Reusable Alpine.js component

Livewire already includes Alpine.js by default. Do not start a second Alpine instance. Register the reusable component when Alpine initializes:

```js
// resources/js/app.js
import '@jacobdelcroix/sportsboard/element';

document.addEventListener('alpine:init', () => {
  Alpine.data('sportsBoardExercise', (endpoint) => ({
    saving: false,
    dirty: false,
    error: '',
    previewUrl: null,

    changed() {
      this.dirty = true;
    },

    async refreshPreview() {
      const blob = await this.$refs.board.toBlob({
        width: 640,
        type: 'image/webp',
        quality: 0.85
      });

      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = URL.createObjectURL(blob);
    },

    async submit() {
      if (this.saving) return;

      this.saving = true;
      this.error = '';

      try {
        const thumbnail = await this.$refs.board.toBlob({
          width: 640,
          type: 'image/webp',
          quality: 0.85
        });

        const body = new FormData(this.$refs.form);
        body.set('diagram', this.$refs.board.toJSON());
        body.set('thumbnail', thumbnail, 'diagram.webp');

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message ?? `Save failed (${response.status})`);
        }

        this.dirty = false;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.saving = false;
      }
    },

    destroy() {
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    }
  }));
});
```

Use that Alpine component from Blade:

```blade
<div x-data="sportsBoardExercise(@js(route('exercises.diagrams.update', [$exercise, $diagram])))">
    <form x-ref="form" @submit.prevent="submit">
        @csrf
        @method('PUT')

        <div class="h-[760px] w-full">
            <sports-board-editor
                x-ref="board"
                name="diagram"
                sport="{{ $diagram->sport }}"
                locale="{{ app()->getLocale() === 'fr' ? 'fr' : 'en' }}"
                data="{{ json_encode($diagram->document) }}"
                class="h-full w-full"
                @change="changed"
                @save="submit"
            ></sports-board-editor>
        </div>

        <div class="mt-4 flex gap-3">
            <button type="button" @click="refreshPreview">Refresh preview</button>
            <button type="submit" :disabled="saving">
                <span x-show="!saving">Save exercise</span>
                <span x-show="saving">Saving…</span>
            </button>
        </div>

        <p x-show="dirty">The diagram has unsaved changes.</p>
        <p x-show="error" x-text="error" role="alert"></p>

        <img
            x-show="previewUrl"
            :src="previewUrl"
            alt="Diagram preview"
            class="mt-4 w-80 rounded-xl"
        >
    </form>
</div>
```

Alpine listens directly to SportsBoard's bubbling `change` and `save` events. `$refs` keeps DOM access scoped to the component, and `destroy()` releases the preview object URL when Alpine removes the component.

## Livewire and Alpine together

Inside a Livewire component, use Alpine for local interface state and call `$wire` directly when persistence is needed. Avoid `@entangle` for the diagram JSON: it duplicates a potentially large document and can create unnecessary synchronization.

```blade
<div x-data="{ dirty: false, saving: false }">
    <div wire:ignore class="h-[760px]">
        <sports-board-editor
            x-ref="board"
            sport="basketball"
            data="{{ $diagram }}"
            class="h-full w-full"
            @change="dirty = true"
        ></sports-board-editor>
    </div>

    <button
        type="button"
        :disabled="saving"
        @click="
            saving = true;
            $wire.diagram = $refs.board.toJSON();
            $wire.save().then(() => {
                dirty = false;
                saving = false;
            });
        "
    >
        Save JSON
    </button>

    <span x-show="dirty">Unsaved changes</span>
</div>
```

Use the complete Livewire upload example above when the same action must also persist a thumbnail.

## Navigation and cleanup

- Keep the custom element inside `wire:ignore` so Livewire does not morph Konva-managed children.
- Keep buttons, messages, and loading indicators outside `wire:ignore` when Livewire must update them.
- Component-scoped Livewire scripts are preferred for component-specific listeners.
- Alpine's `destroy()` hook should revoke object URLs and remove any global listener created by the component.
- The custom element destroys its canvas automatically when it is disconnected.
- With `wire:navigate`, initialize page-specific code from Livewire component scripts instead of relying only on the first `DOMContentLoaded` event.

## Official framework references

- [Livewire 4 JavaScript integration](https://livewire.laravel.com/docs/4.x/javascript)
- [Livewire 4 file uploads](https://livewire.laravel.com/docs/4.x/uploads)
- [Livewire and Alpine.js](https://livewire.laravel.com/docs/4.x/alpine)
- [Alpine.data reusable components](https://alpinejs.dev/globals/alpine-data)
- [Alpine `$refs`](https://alpinejs.dev/magics/refs)
