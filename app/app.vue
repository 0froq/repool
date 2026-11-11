<script setup lang="ts">
import { Paper } from '@froq/ui'

const { me } = useViewer()
</script>

<template>
  <div class="ui">
    <Paper>
      <RadarApp v-if="me.data.value?.authenticated" />
      <SignIn
        v-else-if="me.status.value !== 'pending'"
        :configured="me.data.value?.configured ?? false"
      />
    </Paper>
  </div>
</template>
