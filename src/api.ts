import type { Visitor } from 'models/visitor';
import type { SessionConfig } from 'types/api';

export class Api {
  private visitor: Visitor;

  public constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  public async getSessionConfig(): Promise<SessionConfig> {
    const res = await this.getSettingsData();

    if (!res.ok) {
      throw new Error('API returned non 200');
    }

    const { data } = await res.json() as { data: SessionConfig };

    // These checks all exist in the gateway anyway,
    // this is just to reduce the load if we don't need
    // to call
    data.siteSessionSettings.url ||= location.origin;
    data.siteSessionSettings.anonymiseFormInputs ||= true;
    data.siteSessionSettings.anonymiseText ||= false;
    data.siteSessionSettings.cssSelectorBlacklist ||= [];
    data.siteSessionSettings.ingestEnabled ||= true;
    data.siteSessionSettings.invalidOrExceededPlan ||= false;

    data.siteSessionSettings.consent ||= {
      layout: 'bottom_left',
      consentMethod: 'disabled',
    };

    return data;
  }

  private async getSettingsData(): Promise<Response> {
    const { siteId } = this.visitor;

    const query = `
      {
        siteSessionSettings(siteId: \"${siteId}\") {
          url
          cssSelectorBlacklist
          anonymiseFormInputs
          anonymiseText
          ingestEnabled
          invalidOrExceededPlan
          magicErasureEnabled
          feedback {
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
          consent {
            consentMethod
            layout
          }
        }
      }
    `;

    return fetch(`${PROTOCOL}://${HOST}/gateway/graphql`, {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
    });
  }
}
