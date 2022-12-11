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

    // These checks all exist in the gateway anyway,
    // this is just to reduce the load if we don't need
    // to call
    data.siteSessionSettings ||= {
      url: location.origin,
      anonymiseFormInputs: true,
      anonymiseText: false,
      cssSelectorBlacklist: [],
      ingestEnabled: true,
      invalidOrExceededPlan: false,
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
          url
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
