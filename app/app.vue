<script setup lang="ts">
const router = useRouter();

const setup = await useFetch("/api/v1/setup");
if (setup.data.value?.needsSetup) {
  router.push("/setup");
}
</script>

<template>
  <UApp> </UApp>
</template>
