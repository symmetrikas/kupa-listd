import { fetchList } from "../content.js";
import { embed } from "../util.js";
import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

export default {
  components: { Spinner, LevelAuthors },
  data: () => ({
    packs: [],
    list: [],
    selectedPackIndex: 0,
    selectedLevelIndex: 0,
    loading: true,
  }),
  computed: {
    selectedPack() {
      return this.packs[this.selectedPackIndex] || null;
    },
    selectedLevelId() {
      return this.selectedPack?.levels[this.selectedLevelIndex] || null;
    },
    selectedLevel() {
      return this.list.find(([lvl]) => lvl?.id === this.selectedLevelId)?.[0] || null;
    },
    getOriginalRank() {
      return (levelId) => {
        return (
          this.list.findIndex(([lvl]) => lvl?.id === levelId) + 1 || "?"
        );
      };
    },
    packsByTier() {
    const tiers = [
        { name: "Iron Tier", min: 50, color: "#b8b8b8" },
        { name: "Gold Tier", min: 75, color: "#e0b52b" },
        { name: "Ruby Tier", min: 100, color: "#ed4055" },
        { name: "Sapphire Tier", min: 150, color: "#3987e8" },
        { name: "Diamond Tier", min: 250, color: "#55d9ed" },
    ];

    return tiers.map((tier, index) => ({
        ...tier,
        packs: this.packs
            .filter(pack => {
                const points = Number(pack.points) || 0;
                const nextTier = tiers[index + 1];

                return points >= tier.min &&
                    (!nextTier || points < nextTier.min);
            })
            .sort((a, b) => b.points - a.points),
    }));
  },
  },
  async mounted() {
    try {
      const list = await fetchList();

      const response = await fetch("/data/_packs.json");

      if (!response.ok) {
        throw new Error(
          `Could not load _packs.json: HTTP ${response.status}`
        );
      }

      const packsData = await response.json();

      if (!Array.isArray(packsData)) {
        throw new Error("_packs.json must contain an array of packs");
      }

      this.list = list;
      this.packs = packsData;

      console.log("Packs loaded:", this.packs);
      console.log("Packs by tier:", this.packsByTier);
    } catch (error) {
      console.error("Error loading packs page:", error);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    embed,
  },
  template: `
    <main v-if="loading">
      <Spinner></Spinner>
    </main>
    <main v-else class="page-list-packs">
      <!-- Pack selector -->
 <div class="pack-tiers">
        <section
          v-for="tier in packsByTier"
          :key="tier.name"
          class="pack-tier"
          v-if="tier.packs.length"
        >
          <h2
            class="pack-tier-title"
            :style="{ backgroundColor: tier.color }"
          >
            {{ tier.name }}
          </h2>

          <button
            v-for="pack in tier.packs"
            :key="pack.name"
            class="pack-item"
            @click="
              selectedPackIndex = packs.indexOf(pack);
              selectedLevelIndex = 0
            "
          >
            <span>{{ pack.name }}</span>
            <span>{{ pack.points }} points</span>
          </button>
        </section>
      </div>

      <div class="list-container">
        <!-- Level list in the selected pack -->
        <table class="list" v-if="selectedPack">
          <tr
            v-for="(levelId, i) in selectedPack.levels"
            :key="levelId"
          >
            <td class="rank">
              <p class="type-label-lg">
                #{{ i + 1 }}
              </p>
            </td>
            <td
              class="level"
              :class="{ active: selectedLevelIndex === i }"
            >
              <button @click="selectedLevelIndex = i">
                <span class="type-label-lg">
                  {{
                    list.find(([lvl]) => lvl?.id === levelId)?.[0]?.name ||
                    'Error'
                  }}
                </span>
              </button>
            </td>
          </tr>
        </table>
      </div>

      <!-- Level detail -->
      <div class="level-container" v-if="selectedLevel">
        <div class="level">
          <h1>{{ selectedLevel.name }}</h1>
          <LevelAuthors
            :author="selectedLevel.author"
            :creators="selectedLevel.creators"
            :verifier="selectedLevel.verifier"
          ></LevelAuthors>
          <iframe
            class="video"
            id="videoframe"
            :src="embed(selectedLevel.showcase || selectedLevel.verification)"
            frameborder="0"
          ></iframe>
          <ul class="stats">
            <li>
              <div class="type-title-sm">Points when completed</div>
              <p>{{ selectedPack.points || 'N/A' }}</p>
            </li>
            <li>
              <div class="type-title-sm">ID</div>
              <p>{{ selectedLevel.id }}</p>
            </li>
            <li>
              <div class="type-title-sm">FPS</div>
              <p>{{ selectedLevel.fps || 'Any' }}</p>
            </li>
            <li>
              <div class="type-title-sm">VERSION</div>
              <p>{{ selectedLevel.version || 'Any' }}</p>
            </li>
            <li>
          </ul>
        </div>
      </div>
    </main>
  `,
};
