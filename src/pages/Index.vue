<template>
  <q-page>
    <span v-if="!$geolocation.supported">Geolocation API is not supported</span>

    <l-map :center="center" :zoom="zoom" class="fullscreen" v-else>
      <l-tile-layer :attribution="attribution" :url="url"></l-tile-layer>
      <l-marker :icon="marker.icon" :key="marker.index" :lat-lng="marker" v-for="marker in markers"></l-marker>
    </l-map>
  </q-page>
</template>

<script>
import { uid } from 'quasar'
import { LMap, LTileLayer, LMarker } from 'vue2-leaflet'
import { Icon, latLng } from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete Icon.Default.prototype._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
})

var greenIcon = new Icon({
  iconUrl:
    'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export default {
  name: 'PageIndex',
  components: {
    LMap,
    LTileLayer,
    LMarker
  },
  data () {
    return {
      mapId: this.$route.params.id,
      userId: sessionStorage.getItem('user'),
      markers: [],
      center: latLng(0, 0),
      zoom: 10,
      url: 'https://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
    }
  },
  computed: {
    position () {
      const coords = this.$geolocation.coords
      if (!coords) return latLng(0, 0)
      return {
        coords: { lat: coords.latitude, lng: coords.longitude },
        timestamp: Date.now()
      }
    }
  },
  methods: {
    saveMyPosition (coords) {
      const mapRef = this.$db.ref('maps/' + this.mapId)
      mapRef.child(this.userId).set(coords)
    }
  },
  watch: {
    position: {
      handler (newVal, oldVal) {
        if (
          newVal.coords !== oldVal.coords &&
          newVal.timestamp - oldVal.timestamp > 999
        ) {
          this.saveMyPosition(newVal.coords)
        }
      }
    }
  },
  mounted () {
    // generate mapid and change url
    if (!this.mapId) {
      this.mapId = uid()
      this.$router.push(this.mapId)
    }

    // generate userid and save to sessionstorage
    if (!this.userId) {
      this.userId = uid()
      sessionStorage.setItem('user', this.userId)
    }

    // activate geolocation and set start position
    this.$geolocation.watch = true
    this.$geolocation.setOption('enableHighAccuracy', true)
    this.$geolocation.getCurrentPosition().then(data => {
      this.center = latLng(data.coords.latitude, data.coords.longitude)

      this.saveMyPosition({
        lat: data.coords.latitude,
        lng: data.coords.longitude
      })
    })

    // db ref
    const mapRef = this.$db.ref('maps/' + this.mapId)

    // user joins map
    mapRef.on('child_added', snapshot => {
      const user = {
        [snapshot.key]: {
          ...latLng(snapshot.val().lat, snapshot.val().lng),
          icon: snapshot.key === this.userId ? greenIcon : null
        }
      }
      this.markers = { ...this.markers, ...user }
    })

    // user change on map
    mapRef.on('child_changed', snapshot => {
      this.markers[snapshot.key] = {
        ...this.markers[snapshot.key],
        ...latLng(snapshot.val().lat, snapshot.val().lng)
      }
    })

    // remove user on close window
    window.addEventListener(
      'beforeunload',
      () => {
        mapRef.child(this.userId).remove()
      },
      false
    )
  }
}
</script>
