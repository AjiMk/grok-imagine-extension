<script setup>
import { ref } from 'vue';

const activeTab = ref('templates');
const prompt = ref('');
const generationType = ref('image');
const imageAspectRatio = ref('1:1');
const imageSpeed = ref('Speed');

const templates = [
  { id: 1, title: 'Ethereal Flux', type: 'video', featured: true, image: 'https://picsum.photos/seed/flux/800/500' },
  { id: 2, title: 'Neon Noir', type: 'image', image: 'https://picsum.photos/seed/neon/500/500' },
  { id: 3, title: 'Cosmic Oil', type: 'image', image: 'https://picsum.photos/seed/cosmic/500/500' },
  { id: 4, title: 'Prism Flow', type: 'video', image: 'https://picsum.photos/seed/prism/500/500' },
  { id: 5, title: 'Alps Peak', type: 'image', image: 'https://picsum.photos/seed/alps/500/500' },
];

const history = [
  { id: 1, title: 'Twilight Cabin', type: 'Image', ratio: '16:9', time: '2 min ago', image: 'https://picsum.photos/seed/cabin/200/200' },
  { id: 2, title: 'Neon Reflection', type: 'Video', ratio: '1:1', time: '18 min ago', image: 'https://picsum.photos/seed/reflection/200/200' },
  { id: 3, title: 'Cosmic Bloom', type: 'Image', ratio: '9:16', time: '1 hour ago', image: 'https://picsum.photos/seed/bloom/200/200' },
];

const tabs = [
  { id: 'templates', label: 'Templates', icon: '⊞' },
  { id: 'create', label: 'Create', icon: '⊕' },
  { id: 'history', label: 'History', icon: '↺' },
];

function setTab(tabId) {
  activeTab.value = tabId;
}

function generate() {
  if (!prompt.value.trim()) {
    alert('Please enter a prompt');
    return;
  }
  console.log('Generating:', { prompt: prompt.value, type: generationType.value, ratio: imageAspectRatio.value, speed: imageSpeed.value });
  alert('Generation submitted! Check console for details.');
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col">
    <!-- Header -->
    <header class="h-14 px-4 flex items-center justify-between border-b border-border/40 bg-card">
      <div class="flex items-center gap-2">
        <span class="text-primary font-bold tracking-widest text-sm">NOCTURNAL</span>
      </div>
      <button class="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
        AJ
      </button>
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto pb-20">
      <!-- Templates Tab -->
      <div v-if="activeTab === 'templates'" class="p-4 space-y-4">
        <!-- Hero Card -->
        <div class="h-44 rounded-xl relative overflow-hidden bg-card">
          <img
            :src="templates[0].image"
            :alt="templates[0].title"
            class="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <div class="absolute bottom-0 left-0 right-0 p-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] uppercase tracking-wider text-muted-foreground">Selected Template</span>
            </div>
            <h2 class="text-xl font-bold text-foreground">{{ templates[0].title }}</h2>
            <p class="text-sm text-muted-foreground">Cinematic motion graphics with fluid dynamics</p>
          </div>
        </div>

        <!-- Search -->
        <div class="relative">
          <input
            type="text"
            placeholder="Search prompts..."
            class="w-full h-10 pl-10 pr-4 bg-muted/20 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">⌕</span>
        </div>

        <!-- Filter Tabs -->
        <div class="flex gap-2">
          <button class="px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-semibold uppercase tracking-wide">
            Trending
          </button>
          <button class="px-4 py-2 bg-muted/20 text-foreground rounded-full text-xs font-medium uppercase tracking-wide">
            New
          </button>
        </div>

        <!-- Template Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="template in templates.slice(1)"
            :key="template.id"
            class="aspect-square rounded-xl relative overflow-hidden bg-card cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          >
            <img
              :src="template.image"
              :alt="template.title"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div class="absolute bottom-0 left-0 right-0 p-3">
              <span
                class="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
                :class="template.type === 'video' ? 'bg-amber-500/20 text-amber-600' : 'bg-muted/40 text-muted-foreground'"
              >
                {{ template.type }}
              </span>
              <h3 class="text-sm font-semibold mt-1">{{ template.title }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Tab -->
      <div v-if="activeTab === 'create'" class="p-4 space-y-4">
        <!-- Hero -->
        <div class="h-36 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
          <div class="absolute inset-0 flex items-end p-4">
            <div>
              <p class="text-[10px] uppercase tracking-wider text-muted-foreground">Generate Content</p>
              <h2 class="text-lg font-bold mt-1">Cinematic Landscape</h2>
              <p class="text-xs text-muted-foreground">Describe the mood, motion, and atmosphere</p>
            </div>
          </div>
        </div>

        <!-- Prompt Input -->
        <textarea
          v-model="prompt"
          placeholder="Describe specific details, mood, or elements to add..."
          class="w-full h-32 p-4 bg-muted/10 rounded-xl border border-border/20 resize-none outline-none focus:ring-2 focus:ring-primary/50 text-sm"
        ></textarea>

        <!-- Generation Type Toggle -->
        <div class="flex gap-2">
          <button
            @click="generationType = 'image'"
            :class="[
              'flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-semibold transition-all',
              generationType === 'image' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted/20 text-muted-foreground'
            ]"
          >
            <span>🖼</span>
            <span>Image</span>
          </button>
          <button
            @click="generationType = 'video'"
            :class="[
              'flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-semibold transition-all',
              generationType === 'video' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted/20 text-muted-foreground'
            ]"
          >
            <span>🎬</span>
            <span>Video</span>
          </button>
        </div>

        <!-- Controls -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-4 bg-muted/10 rounded-xl space-y-2">
            <label class="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Aspect Ratio</label>
            <select
              v-model="imageAspectRatio"
              class="w-full bg-transparent border-0 outline-none text-sm font-medium cursor-pointer"
            >
              <option value="1:1">1:1</option>
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="4:3">4:3</option>
              <option value="3:4">3:4</option>
            </select>
          </div>
          <div class="p-4 bg-muted/10 rounded-xl space-y-2">
            <label class="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mode</label>
            <select
              v-model="imageSpeed"
              class="w-full bg-transparent border-0 outline-none text-sm font-medium cursor-pointer"
            >
              <option value="Speed">⚡ Speed</option>
              <option value="Quality">✨ Quality</option>
            </select>
          </div>
        </div>

        <!-- Generate Button -->
        <button
          @click="generate"
          class="w-full py-4 bg-primary text-primary-foreground rounded-full font-bold uppercase tracking-wide shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <span>✨</span>
          <span>Generate</span>
        </button>

        <!-- Advanced Settings -->
        <details class="mt-4">
          <summary class="text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            Advanced Settings
          </summary>
          <div class="mt-3 space-y-3 p-4 bg-muted/10 rounded-xl">
            <div class="space-y-2">
              <label class="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Negative Prompt</label>
              <textarea
                placeholder="What should be avoided?"
                class="w-full h-20 p-3 bg-muted/20 rounded-lg border border-border/10 resize-none outline-none text-sm"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-2">
                <label class="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Strength</label>
                <input type="number" value="0.7" step="0.1" min="0" max="1" class="w-full p-3 bg-muted/20 rounded-lg border border-border/10 outline-none text-sm" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Steps</label>
                <input type="number" value="30" min="1" max="100" class="w-full p-3 bg-muted/20 rounded-lg border border-border/10 outline-none text-sm" />
              </div>
            </div>
          </div>
        </details>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="p-4 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] uppercase tracking-wider text-muted-foreground">History</p>
            <h2 class="text-lg font-bold">Recent generations</h2>
          </div>
          <button class="px-4 py-2 bg-muted/20 rounded-full text-xs font-medium hover:bg-muted/30 transition-colors">
            Clear
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="item in history"
            :key="item.id"
            class="flex gap-3 p-3 bg-muted/10 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors"
          >
            <div class="w-16 h-16 rounded-lg overflow-hidden bg-muted/20 shrink-0">
              <img :src="item.image" :alt="item.title" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-sm truncate">{{ item.title }}</h3>
              <p class="text-xs text-muted-foreground mt-0.5">{{ item.type }} · {{ item.ratio }} · {{ item.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom Navigation -->
    <nav class="fixed bottom-4 left-4 right-4 h-16 bg-card/80 backdrop-blur-xl rounded-full border border-border/40 flex items-center justify-around px-2 z-50 shadow-xl">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="setTab(tab.id)"
        :class="[
          'flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-full transition-all',
          activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <span class="text-lg">{{ tab.icon }}</span>
        <span class="text-[10px] uppercase tracking-wide font-medium">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>
