<template>
  <div id="app">
    <div class="header">
        <div class="home-menu pure-menu pure-menu-horizontal pure-menu-fixed">
            <a class="pure-menu-heading" style="text-align: center" href="">Appointment Booking</a>

            <ul class="pure-menu-list">
                <li class="pure-menu-item pure-menu-selected">Select time zone </li>
                <li class="pure-menu-item pure-menu-selected">
                  <select ref="tzselect" @change="onSelectChange($event)" v-model="timeZone">
                  </select>
                </li>
            </ul>
        </div>
    </div>

    <div style="width:300px;">
      <form class="pure-form">
        <fieldset>
              <legend>Add Meeting</legend>
              <input type="date" v-model="addDate" placeholder="Date" />
              <input type="time" v-model="addTime" placeholder="Time" />
              <input type="number" v-model="addDuration" placeholder="Duration" />
              <button class="pure-button" type="button" @click="addEvent">
                Create Event
              </button>
        </fieldset>
      </form>
      <span>{{addMessageComputed}}</span>
    </div>

    <Meeting :eventsProp="eventsComputed" :startHour="startHour" :endHour="endHour"></Meeting>

  </div>
</template>

<script>
import Meeting from "./components/Meeting.vue";
import moment from "moment-timezone";
import axios from "axios";
import timeZoneList from "./assets/tzlist.json";

export default {
  name: "App",
  components: { Meeting },
  data() {
    return {
      option:"",
      host: "https://us-central1-meetsy-83280.cloudfunctions.net/helloWorld",
      date: new Date().toISOString().slice(0,10), // yyyy-mm-dd
      events: [],
      timeZone: moment.tz.guess(),
      addDate: new Date().toISOString().slice(0,10),
      addTime:"",
      addMessage:"",
      addDuration:30,
      startHour:0,
      endHour:24,
    }
  },
  computed: {
    eventsComputed: function() {
      return this.events;
    },
    addMessageComputed: function() {
      return this.addMessage;
    }
  },
  watch: {
    timeZone: function(val) {
      this.getEvents(this.date, val);
    },
    addDate: function(val) {
      this.getEvents(this.addDate, val);
    }
  },
  created: function() {
      let timezone = timeZoneList;
      for (const [key, value] of Object.entries(timezone)) {
        console.log(`${key}: ${value}`);
        this.option+=`<option value="${key}">${key} ${value}</option>`
      }
  },
  mounted() {
      this.$refs.tzselect.innerHTML=this.option;
      this.getEvents(this.date, this.timeZone);
  },
  methods: {
    onSelectChange(event) {
        console.log(event.target.value);
        this.timeZone = event.target.value;
    },
    addEvent() {
        let dateTime = moment.tz(`${this.addDate} ${this.addTime}`, this.timeZone);
        let data = JSON.stringify({
          "DateTime": dateTime.format(),
          "Duration": this.addDuration
        });
        this.addMessage = "Adding....";
        let config = {
          method: 'POST',
          url: this.host+'/create-event',
          headers: { 
            'Content-Type': 'application/json'
          },
          data : data
        };
        return axios(config)
        .then(function (response) {
          this.addMessage = response.data.message;
        })
        .catch(function (error) {
          this.addMessage = "Failed to Add";
        });
    },
    getHour(dateTimeString) {
      const time =  new Date(dateTimeString).toLocaleTimeString('en', { timeZone: this.timezone, hour12: false});
      return time.split(':')[0];
    },
    getEvents(date,timezone) {
      const config = {
        method: 'get',
        url: `${this.host}/get-events?Date=${date}&TimeZone=${timezone}`,
        headers: { 
          'Content-Type': 'application/json'
        }
      };
      const self = this;
      return axios(config)
      .then(function (response) {
        if(response.data && response.data.events) {
          const {events} = response.data;
          let arr = [];
          events.forEach(function (item) {
            arr.push({
              start:item.startTime.replace(/z|t/gi,' ').trim().slice(0,16),
              end: item.endTime.replace(/z|t/gi,' ').trim().slice(0,16),
              title: "Booked"
            });
          })
          self.events = arr;
        }
        this.addMessage = response.data.message;
      })
      .catch(function (error) {
        console.log(error);
        self.events = [];
      });
    }
  }
}
</script>

<style lang="scss" scoped>
@import url('./assets/styles.css');

@import url('https://unpkg.com/purecss@2.0.5/build/pure-min.css');

#app {
  margin: 100px;
}
</style>