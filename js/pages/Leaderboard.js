import { localize } from '../util.js';
import { fetchLeaderboard, fetchCountries } from '../content.js';
import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        countries: {},
        loading: true,
        selected: 0,
        searchQuery: '',
        err: [],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>

                <div class="board-container">
                    <div class="search-bar">
                        <input
                            type="text"
                            v-model="searchQuery"
                            placeholder="Search players..."
                        />
                    </div>

                    <table class="board">
                        <tr v-for="(ientry, i) in filteredLeaderboard" :key="ientry.user">
                            <td class="rank">
                                <p class="type-label-lg">#{{ leaderboard.indexOf(ientry) + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ localize(ientry.total) }}</p>
                            </td>

                            <td class="country">
                                <p class="type-label-lg">
                                    {{ countries[ientry.user] || "" }}
                                </p>
                                </td>

<td
    class="user"
    :class="{ 'active': selectedEntry === ientry }"
>
<button @click="selectPlayer(ientry)" class="player-button">
    <span class="type-label-lg player-name">
        {{ ientry.user }}
    </span>
</button>
                            </td>
                        </tr>
                    </table>
                    <p v-if="filteredLeaderboard.length === 0" class="no-results">
                        No players match your search.
                    </p>
                </div>

                <div class="player-container" v-if="entry">
                    <div class="player">
                    <h1>
                            #{{ leaderboard.indexOf(entry) + 1 }}
                                {{ entry.user }}
                            <span class="flag">{{ countries[entry.user] || "" }}</span>
                    </h1>
                        <h3>{{ entry.total }}</h3>

                        <h2 v-if="entry.verified.length > 0">
                            Verified ({{ entry.verified.length}})
                        </h2>

                        <table class="table">
                            <tr v-for="score in entry.verified">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>

                        <h2 v-if="entry.completed.length > 0">
                            Completed ({{ entry.completed.length }})
                        </h2>

                        <table class="table">
                            <tr v-for="score in entry.completed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        
    <h2 v-if="entry.packCompletions && entry.packCompletions.length > 0">
    Pack Completions ({{ entry.packCompletions.length }})
</h2>

<table
    class="table pack-completions"
    v-if="entry.packCompletions && entry.packCompletions.length > 0"
>
    <tr
        v-for="pack in entry.packCompletions"
        :key="pack.name"
    >
        <td class="level">
            <p
                class="type-label-lg pack-name"
            >
                {{ pack.name }}
            </p>
        </td>
    </tr>
</table>

                        <h2 v-if="entry.progressed.length > 0">
                            Progressed ({{entry.progressed.length}})
                        </h2>

                        <table class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">
                                        {{ score.percent }}% {{ score.level }}
                                    </a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        filteredLeaderboard() {
            return this.leaderboard.filter((player) =>
                player.user
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase())
            );
        },

        selectedEntry() {
            return this.leaderboard[this.selected];
        },

        entry() {
            return this.selectedEntry;
        },
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard;
        this.countries = await fetchCountries();
        this.err = err;

        // Hide loading spinner
        this.loading = false;
    },
    methods: {
        localize,

        selectPlayer(player) {
            this.selected = this.leaderboard.indexOf(player);
        },
    },
};
