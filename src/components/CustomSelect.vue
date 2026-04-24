<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: String,
  options: Array,
  placeholder: {
    type: String,
    default: 'Select...'
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);

function selectOption(value) {
  emit('update:modelValue', value);
  isOpen.value = false;
}

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function handleClickOutside(event) {
  if (!event.target.closest('.custom-select-wrapper')) {
    isOpen.value = false;
  }
}
</script>

<template>
  <div class="relative custom-select-wrapper" @click="toggleDropdown">
    <button
      type="button"
      class="w-full bg-muted/20 border border-border/20 rounded-lg px-4 py-2.5 pr-8 text-sm font-medium cursor-pointer flex items-center justify-between focus:ring-2 focus:ring-primary/50"
    >
      <span :class="modelValue ? 'text-foreground' : 'text-muted-foreground'">
        {{ modelValue || placeholder }}
      </span>
      <svg
        class="w-4 h-4 text-muted-foreground transition-transform"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <ul
        v-if="isOpen"
        class="absolute z-50 w-full mt-1 bg-card border border-border/20 rounded-lg shadow-lg overflow-hidden py-1"
      >
        <li
          v-for="option in options"
          :key="option.value"
          @click.stop="selectOption(option.value)"
          class="px-4 py-2.5 text-sm cursor-pointer transition-colors"
          :class="
            modelValue === option.value
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-foreground hover:bg-muted/20'
          "
        >
          {{ option.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
