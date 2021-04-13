<template>
  <div>
   
   <div style="display:flex; flex-direction: row;margin-top:50px;">

    <vue-cal :events="eventsProp" 
      hide-weekends
      hide-view-selector
      :disable-views="['month']"
      events-count-on-year-view 
      events-on-month-view="short"
      active-view="week"
      :hide-weekdays="[6,7]"
      :time-from="startHour * 60" 
      :time-to="endHour * 60" style="height: 600px; flex: 75%" class="vuecal--blue-theme"
      :editable-events="{ title: false, drag: false, resize: true, delete: true, create: true }"
      :drag-to-create-threshold="0"
      :snap-to-time="30"
     />

   </div>


  </div>
</template>

<script>
import VueCal from 'vue-cal'

export default {
  name: "Meeting",
  components: { VueCal },
  data: () => ({

  }),
  props: {
    eventsProp: Array,
    startHour: Number,
    endHour: Number
  },
  computed: {
    minDate () {
      return new Date()
    }
  },
  created: function() {
    console.log(this.startHour, this.endHour);
  },
}
</script>

<style lang="scss" scoped>

@import 'vue-cal/dist/vuecal.css';

.vuecal__now-line {color: #06c;}
* {font: 10px sans-serif;margin: 0;padding: 0;}

</style>