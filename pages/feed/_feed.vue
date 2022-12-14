<template>
  <section
    class="
      wldc-feed-page w-100 h-100
      d-flex flex-column align-items-center justify-content-center"
  >
    <!-- <h2 v-if="feedName">
          {{$t('Label-ReviewFeed')}}<sup class="text-warning">β</sup> {{feedName}}
        </h2> -->
    <template v-if="!loading">
      <div
        v-if="currentWikiRevId && revisionPanelItems[currentWikiRevId]"
        class="
            wldc-feed-card
            card
            h-xm-100
            container-md container-lg container-fluid shadow
            d-flex flex-column
            "
      >
        <RevisionPanel
          :key="currentWikiRevId"
          :item="revisionPanelItems[currentWikiRevId]"
          :feed-name="wikiRevIdfromFeeds[currentWikiRevId]"
          class="wldc-revision-panel-wrapper d-flex flex-column"
        />
        <template v-if="currentWikiRevId && revisionPanelItems[currentWikiRevId]">
          <button
            v-if="!showJudgementPanel"
            class="btn btn-outline-primary"
            @click="showJudgementPanel = !showJudgementPanel"
          >
            {{ $t('Button-ShowJudgements') }}
          </button>
          <JudgementPanel
            v-else
            ref="judgementPanel"
            class="card-body"
            :wiki-rev-id="currentWikiRevId"
          />
        </template>
        <ActionPanel
          ref="actionPanel"
          :key="`action-panel-${currentWikiRevId}`"
          :wiki-rev-id="currentWikiRevId"
          :title="revisionPanelItems[currentWikiRevId].title"
          :feed="wikiRevIdfromFeeds[currentWikiRevId]"
          class="wldc-action-panel-container"
          @judgement-event="$refs.judgementPanel && $refs.judgementPanel.refresh()"
          @next-card="showNext()"
        />
      </div>
      <div v-else>
        <!-- has no new revision -->
        <div class="card">
          <div class="card-body">
            <div class="card-body w-100 text-center">
              <h5 m-5>
                <!-- eslint-disable vue/no-v-html-->
                <span
                  v-html="$t('Message-FeedHasNoNewRevisionsClickNextBelow', [
                    `<div class='badge badge-success'>${wikiRevIdfromFeeds[currentWikiRevId] || feedName}</div>`])"
                />
                <!-- eslint-enable vue/no-v-html-->
              </h5>
              <button v-if="feedName==='mix'" class="m-5 btn btn-outline-success" @click="showNext()">
                {{ $t(`Button-Next`) }}(→)
              </button>
              <a v-else class="btn btn-primary" href="/">
                {{ $t('Label-Home') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <loading-indicator />
    </template>

    <b-modal id="modal-promote-login" title="Tip: Login">
      {{ $t('Message-Login') }}<br>
      <template #modal-footer>
        <a class="btn-sm btn btn-primary" href="/auth/mediawiki/login">{{ $t("Label-Login") }}</a>
        <b-button size="sm" variant="secondary" @click="snoozeTipLogin()">
          {{ $t("Label-Snooze") }}
        </b-button>
      </template>
    </b-modal>
  </section>
</template>

<script lang="ts">
import { RevisionPanelItem } from '@/shared/interfaces';
import RevisionPanel from '~/components/RevisionPanel.vue';
import ActionPanel from '~/components/ActionPanel.vue';
import JudgementPanel from '~/components/JudgementPanel.vue';
import LoadingIndicator from '~/components/LoadingIndicator.vue';
import { fetchRevisionPanelItem } from '~/shared/utility-shared';
const QUEUE_LIMIT = 2;
export default {
  components: {
    RevisionPanel,
    ActionPanel,
    JudgementPanel,
    LoadingIndicator,

  },
  validate({ params }) {
    return (['us2020', 'covid19', 'recent', 'ores', 'mix', 'wikitrust', 'lastbad'].includes(params.feed));
  },
  asyncData({ params, $axios }) {
    return { feedName: params.feed };
  },
  data() {
    return {
      title: 'WikiLoop DoubleCheck',
      currentWikiRevId: null,
      feedQueue: [],
      revisionPanelItems: {},
      wikiRevIdfromFeeds: {},
      tipLoginCountDown: 5,
      loading: true,
      showJudgementPanel: false,
    };
  },
  computed: {
  },
  async beforeMount() {
  },
  async mounted() {
    document.addEventListener('wiki-change-started', async () => {
      await this.clearQueue();
    });
    document.addEventListener('wiki-change-completed', async () => {
      await this.refillQueue();
    });

    document.addEventListener('judgement-event', () => {
      if (!(this.$store.state.user && this.$store.state.user.profile)) {
        if (this.tipLoginCountDown === 0) {
          this.$bvModal.show('modal-promote-login');
        } else {
          this.tipLoginCountDown--;
        }
      }
    });

    window.addEventListener('keyup', async (e) => {
      switch (e.code) {
      case 'KeyV':
        await this.$refs.actionPanel?.interactionBtn('ShouldRevert');
        break;
      case 'KeyG':
        await this.$refs.actionPanel?.interactionBtn('LooksGood');
        break;
      case 'KeyP':
        await this.$refs.actionPanel?.interactionBtn('NotSure');
        break;
      case 'KeyR':
        await this.$refs.actionPanel?.performRevert();
        break;
      case 'ArrowLeft':
        this.$refs.actionPanel?.undo();
        break;
      case 'ArrowRight':
        await this.showNext();
        break;
      case 'PageUp':
        this.$refs.actionPanel?.$el.querySelector('.diff-card').scrollBy(0, -200);
        break;
      case 'PageDown':
        this.$refs.actionPanel?.$el.querySelector('.diff-card').scrollBy(0, 200);
        break;
      }
      if (e.key === '?') {
        // Show key screen
        this.$bvModal.show('modal-keymap');
      }
    });

    await this.showNext();
  },
  methods: {
    async showNext() {
      this.loading = true;
      this.showJudgementPanel = false;
      if (this.feedQueue.length <= 1) {
        await this.refillQueue();
      }
      this.currentWikiRevId = this.feedQueue.shift();
      this.loading = false;
      this.refillQueue().then(() => {console.log('Quietly refilled the queue.');});
    },
    clearQueue() {
      this.loading = true;
      this.showJudgementPanel = false;
      this.feedQueue = [];
      this.revisionPanelItems = {};
    },

    async fetchAndClaimRevisions(numToFetch:number):Promise<string[]/* wikiRevIds */> {
      const queryObj:any = {
        limit: numToFetch,
        wiki: this.$store.state.wiki,
        feed: this.feedName,
        userGaId: this.$cookiez.get('_ga'),
      };
      if (this.$store.state.user?.profile?.displayName) {queryObj.wikiUserName = this.$store.state.user?.profile?.displayName;}
      const params = new URLSearchParams(queryObj);
      const result = await this.$axios.$get(`/api/feed/${this.feedName}?${params.toString()}`);
      const feed = result.feed;
      result.wikiRevIds.forEach((wikiRevId) => {
        this.wikiRevIdfromFeeds[wikiRevId] = feed;
      });
      return result.wikiRevIds;
    },
    async refillQueue() {
      const numToFetch = QUEUE_LIMIT - this.feedQueue.length;
      const wikiRevIds = await this.fetchAndClaimRevisions(numToFetch);
      this.feedQueue.push(...wikiRevIds);
      await Promise.all(wikiRevIds.map(async (wikiRevId) => {
        const item = await fetchRevisionPanelItem(wikiRevId, this.$axios);
        this.revisionPanelItems[wikiRevId] = item;
      }));
    },
    snoozeTipLogin() {
      this.tipLoginCountDown = 15;
      this.$bvModal.hide('modal-promote-login');
    },
  },
};
</script>

<style lang="scss" scoped>

  @import 'bootstrap/scss/_functions.scss';
  @import 'bootstrap/scss/_variables.scss';
  @import 'bootstrap/scss/_mixins.scss';

  .wldc-feed-card {
    min-height: 0;
    section {
      min-height:0;
    }
    @include media-breakpoint-down(sm) {
      flex-grow: 1;
    }
  }
</style>
