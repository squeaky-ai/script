import type { Visitor } from 'models/visitor';
import type { SessionConfig } from 'types/api';

export class Api {
  private visitor: Visitor;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public async getSessionConfig(): Promise<SessionConfig> {
    const res = await this.getSettingsData();
    const { data } = await res.json() as { data: SessionConfig };

    data.siteSessionSettings ||= {
      anonymiseFormInputs: true,
      anonymiseText: false,
      cssSelectorBlacklist: [],
      ingestEnabled: true,
      invalidOrExceededPlan: false, // Let the Gateway decide if we don't know
    };

    data.consent ||= {
      layout: 'bottom_left',
      consentMethod: 'disabled',
    };

    return data;
  }

  private async getSettingsData(): Promise<Response> {
    const { siteId } = this.visitor;

    const query = `
      {
        feedback(siteId: \"${siteId}\") {
          npsEnabled
          npsAccentColor
          npsSchedule
          npsPhrase
          npsFollowUpEnabled
          npsContactConsentEnabled
          npsLayout
          npsExcludedPages
          sentimentEnabled
          sentimentAccentColor
          sentimentExcludedPages
          sentimentLayout
          sentimentDevices
          sentimentSchedule
        }
        siteByUuid(siteId: \"${siteId}\") {
          magicErasureEnabled
        }
        consent(siteId: \"${siteId}\") {
          consentMethod
          layout
        }
        siteSessionSettings(siteId: \"${siteId}\") {
          cssSelectorBlacklist
          anonymiseFormInputs
          anonymiseText
          ingestEnabled
          invalidOrExceededPlan
        }
      }
    `;

    return fetch(`${API_SERVER_HOST}/graphql`, {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
    });
  }
}
