/**
 * the reason why this is abstract class instead of interface is that we need the protected method.
 *
 * To use this class, you should create a fake static new constructor
 */
export abstract class LifeCycle {
  /**
   *  create a static
   */
  protected abstract onReady(): void;
}
