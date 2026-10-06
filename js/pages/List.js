//search bar code by aelz

import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList, fetchTags } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
  data: () => ({
    list: [],
    editors: [],
    tags: [],
    selectedTag: "All",
    loading: true,
    selected: 0,
    errors: [],
    searchQuery: "",
    roleIconMap,
    store,
  }),
computed: {
  filteredList() {
    return this.list.filter(([level, err]) => {
      if (!level || !level.name) return false;

      const matchesSearch =
        !this.searchQuery ||
        level.name.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesTag =
        this.selectedTag === "All" ||
        (level.tags && Array.isArray(level.tags) && level.tags.includes(this.selectedTag));

      return matchesSearch && matchesTag;
    });
  },

  selectedLevel() {
    return this.filteredList[this.selected]
      ? this.filteredList[this.selected][0]
      : null;
  },

  // Compute the original rank (index) in the full list for display purposes.
  selectedIndexInFullList() {
    if (!this.selectedLevel) return this.selected + 1;

    return (
      this.list.findIndex(
        (item) => item[0] && item[0].id === this.selectedLevel.id
      ) + 1
    );
  },
},
  watch: {
    // Reset the selected index when the search query changes.
    searchQuery() {
      this.selected = 0;
    },
  },
  methods: {
    embed,
    score,
    getOriginalRank(level) {
      let index = this.list.findIndex(
        (item) => item[0] && item[0].id === level.id
      );
      return index >= 0 ? index + 1 : this.selected + 1;
    },
  },
  async mounted() {
    this.list = await fetchList();
    this.editors = await fetchEditors();
    this.tags = await fetchTags();
    if (!this.list) {
      this.errors = [
        "Failed to load list. Retry in a few minutes or notify list staff.",
      ];
    } else {
      this.errors.push(
        ...this.list
          .filter(([_, err]) => err)
          .map(([_, err]) => `Failed to load level. (${err}.json)`)
      );
      if (!this.editors) {
        this.errors.push("Failed to load list editors.");
      }
    }
    this.loading = false;
  },
  template: `
    <main v-if="loading">
      <Spinner></Spinner>
    </main>
    <main v-else class="page-list">
      <div class="list-container">
        <!-- Search Bar -->
<div class="search-bar">
   <input type="text" v-model="searchQuery" placeholder="Search levels..." />
   
   <select class="tag-filter" v-model="selectedTag">
     <option value="All">All Tags</option>
     <option
       v-for="tag in tags"
       :key="tag.name"
       :value="tag.name"
     >
       {{ tag.name }}
     </option>
   </select>
</div>
        <table class="list" v-if="filteredList.length">
          <tr v-for="(item, i) in filteredList" :key="i">
            <td class="rank">
              <p v-if="getOriginalRank(item[0]) <= 300" class="type-label-lg">
                #{{ getOriginalRank(item[0]) }}
              </p>
              <p v-else class="type-label-lg">Legacy</p>
            </td>
            <td class="level" :class="{ 'active': selected === i, 'error': !item[0] }">
              <button @click="selected = i">
                <span class="type-label-lg">
                  {{ item[0]?.name || \`Error (\${item[1]}.json)\` }}
                </span>
              </button>
            </td>
          </tr>
        </table>
        <p v-if="filteredList.length === 0">No levels match your search.</p>
      </div>
      <div class="level-container" v-if="selectedLevel">
        <div class="level">
          <h1>{{ selectedLevel.name }}</h1>
          <LevelAuthors :author="selectedLevel.author" :creators="selectedLevel.creators" :verifier="selectedLevel.verifier"></LevelAuthors>
          <div class="level-description-container" v-if="selectedLevel.description">
    <div class="description-divider"></div>

    <p class="level-description">
        {{ selectedLevel.description }}
    </p>

    <div class="description-divider"></div>
</div>
        <iframe class="video" id="videoframe" :src="embed(selectedLevel.showcase || selectedLevel.verification)" frameborder="0"></iframe>
            <div class="level-tags" v-if="selectedLevel && Array.isArray(selectedLevel.tags) && selectedLevel.tags.length > 0">
  <span
    v-for="tag in selectedLevel.tags"
    :key="tag"
    class="level-tag"
  >
    {{ tag }}
  </span>
</div>
<ul class="stats">
            <li>
              <div class="type-title-sm">Points when completed</div>
              <p>
                {{
                  score(getOriginalRank(selectedLevel), 100, selectedLevel.percentToQualify)
                }}
              </p>
            </li>
            <li>
              <div class="type-title-sm">ID</div>
              <p>{{ selectedLevel.id }}</p>
            </li>
           <li>
  <div class="type-title-sm">ENJOYMENT</div>
  <p>{{ selectedLevel.enjoyment || 'N/A' }}</p>
        </li>
          </ul>
          <h2>Records</h2>
          <p v-if="selectedIndexInFullList <= 75">
            <strong>{{ selectedLevel.percentToQualify }}%</strong> or better to qualify
          </p>
          <p v-else-if="selectedIndexInFullList <= 150">
            <strong>100%</strong> or better to qualify
          </p>
          <p v-else>This level does not accept new records.</p>
          <table class="records">
            <tr v-for="record in selectedLevel.records" class="record">
              <td class="percent">
                <p>{{ record.percent }}%</p>
              </td>
              <td class="user">
                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
              </td>
              <td class="mobile">
                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
              </td>
              <td>
                <p>{{ record.hz }}</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
      <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
        <p>(ノಠ益ಠ)ノ彡┻━┻</p>
      </div>
      <div class="meta-container">
        <div class="meta">
          <div class="errors" v-show="errors.length > 0">
            <p class="error" v-for="error of errors">{{ error }}</p>
          </div>
          <template v-if="editors">
            <h3>List Editors</h3>
            <ol class="editors">
              <li v-for="editor in editors" :key="editor.name">
                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                <p v-else>{{ editor.name }}</p>
              </li>
            </ol>
            </template>
                   <h3>Submission Requirements</h3>
                    <p>
                        Achieved the record without using hacks (however, FPS bypass is allowed, up to 360fps)
                    </p>
                    <p>
                        Achieved the record on the level that is listed on the site - please check the level ID before you submit a record
                    </p>
                    <p>
                        Have either source audio or clicks/taps in the video. Edited audio only does not count
                    </p>
                     <p>
                        Audible clicks and a cheat indicator are a REQUIREMENT for verifications and completions, IF IT LACKS ONE OF THESE, they will be denied.
                    </p>
                    <p>
                       3 minutes or more of raw footage for top 15's, even if it's a verification
                    </p>
                    <p>
                        The recording must have a previous attempt and entire death animation shown before the completion, unless the completion is on the first attempt. Everyplay records are exempt from this
                    </p>
                    <p>
                        The recording must also show the player hit the endwall, or the completion will be invalidated.
                    </p>
                    <p>
                        Do not use secret routes or bug routes
                    </p>
                    <p>
                        Do not use easy modes, only a record of the unmodified level qualifies
                    </p>
                    <p>
                        Once a level falls onto the Legacy List, we accept records for it for 24 hours after it falls off, then afterwards we never accept records for said level
                    </p>
                    <div class="og">
            <p class="type-label-md">
              Website layout made by
              <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a>
            </p>
          </div>
          <div class="oo">
            <p class="type-label-md">
              Code for packs made by
              <a href="https://github.com/snailmusic" target="_blank">Snail</a>
            </p>
          </div>
          <div class="gg">
            <p class="type-label-md">
              Code for search bar made by
              <a href="https://youtube.com/@aelzfr?si=cxdgt4r3wp4S4Dyn" target="_blank">Aelz</a>
            </p>
          </div>
                </div>
          </div>
      </main>
    `,
};
