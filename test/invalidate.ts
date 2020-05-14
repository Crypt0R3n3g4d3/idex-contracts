import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';

import { deployAndAssociateContracts } from './helpers';
import { uuidToHexString } from '../lib';

// TODO Test executeTrade respects invalidated order nonces
contract('Exchange (invalidations)', (accounts) => {
  describe('invalidateOrderNonce', async () => {
    it('should work on initial call', async () => {
      const { exchange } = await deployAndAssociateContracts();

      await exchange.invalidateOrderNonce(uuidToHexString(uuidv1()));

      const events = await exchange.getPastEvents('InvalidatedOrderNonce', {
        fromBlock: 0,
      });
      expect(events).to.be.an('array');
      expect(events.length).to.equal(1);
    });

    it('should work on subsequent call with a later timestamp', async () => {
      const { exchange } = await deployAndAssociateContracts();

      await exchange.invalidateOrderNonce(uuidToHexString(uuidv1()));
      await exchange.invalidateOrderNonce(uuidToHexString(uuidv1()));

      const events = await exchange.getPastEvents('InvalidatedOrderNonce', {
        fromBlock: 0,
      });
      expect(events).to.be.an('array');
      expect(events.length).to.equal(2);
    });

    it('should revert on subsequent call with same timestamp', async () => {
      const { exchange } = await deployAndAssociateContracts();
      const uuid = uuidv1();
      await exchange.invalidateOrderNonce(uuidToHexString(uuid));

      let error;
      try {
        await exchange.invalidateOrderNonce(uuidToHexString(uuid));
      } catch (e) {
        error = e;
      }

      expect(error).to.not.be.undefined;
      expect(error.message).to.match(/nonce timestamp already invalidated/i);
    });

    it('should revert on subsequent call before block threshold of previous', async () => {
      const { exchange } = await deployAndAssociateContracts();
      await exchange.setChainPropagationPeriod(10);
      await exchange.invalidateOrderNonce(uuidToHexString(uuidv1()));

      let error;
      try {
        await exchange.invalidateOrderNonce(uuidToHexString(uuidv1()));
      } catch (e) {
        error = e;
      }

      expect(error).to.not.be.undefined;
      expect(error.message).to.match(
        /previous invalidation awaiting chain propagation/i,
      );
    });

    it('should revert for non-V1 UUID', async () => {
      const { exchange } = await deployAndAssociateContracts();

      let error;
      try {
        await exchange.invalidateOrderNonce(uuidToHexString(uuidv4()));
      } catch (e) {
        error = e;
      }

      expect(error).to.not.be.undefined;
      expect(error.message).to.match(/must be v1 UUID/i);
    });
  });
});
